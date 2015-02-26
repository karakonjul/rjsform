
(function($){

	if (typeof($.fn.rjsform)!='undefined') {
		throw "rlib.rjsform is being loaded twice!";
	}

	$.widget('rlib.rjsform', {
		options : {
			data : {},
			constructors : {}
		},
		_create : function(){
			this.setData(this.options.data);
		},

		/**
		 * Given a subcontainer and data object, and based on the data-form-group attributes of parent elements,
		 * find the data object that's meant for the given subcontainer.
		 * May return null.
		 * TODO: support [] name suffix
		 */
		_findContainerData : function(container, data){
			if (container.size()==0) return null;
			if (container.size()>1) container = container.first();
			var parents = [];
			container.parentsUntil(this.element, '[data-form-group]').each(function(){
				parents.unshift(this);
			});
			if (container.is('[data-form-group]')) {
				parents.unshift(container[0]);
			}
			result = data;
			parents.forEach(function(p){
				if (result===null) return;
				var key = $(this).attr('data-form-group');
				if (typeof(result[key])=='undefined') {
					result = null;
				} else {
					result = result[key];
				}
			});
			return result;
		},

		/**
		 * Find elements matching the selector without going into [data-form-group] elements
		 */
		_findNoRecursive : function(element, selector){
			return element.find(selector).filter(function(){
				return $(this).parentsUntil(element, '[data-form-group]').size() == 0;
			});
		},

		/**
		 * Returns all inputs matching the given name, skipping the ones that are inside form groups
		 */
		_getInputsByName : function(container, name){
			return this._findNoRecursive(container, '[data-form-name]')
				.filter('input,select,textarea')
				.filter(function(){
					return $(this).attr('data-form-name')==name;
				});
		},

		/**
		 * Searches for a form group with this name within the
		 * given container, without going into other form groups
		 */
		_getFormGroupByName : function(container, name){
			return this._findNoRecursive(container, '[data-form-group]')
				.filter(function(){
					return $(this).attr('data-form-group')==name;
				});
		},

		/**
		 * Handles label clicking by moving focus to the referenced input
		 */
		_labelClickHandler : function(event){
			var self = event.data;
			// try to find container
			var container = self.element.find($(this).closest('[data-form-group]'));
			if (container.size()==0) container = self.element;
			self._getInputsByName(container, $(this).attr('data-form-for')).focus();
		},

		/**
		 * Handles radio group selection - we cannot use the browser
		 * implementation because it relies on using the name attribute.
		 */
		_radioClickHandler : function(event){
			var self = event.data;
			// try to find container
			var container = self.element.find($(this).closest('[data-form-group]'));
			if (container.size()==0) container = self.element;
			var value = $(this).attr('value');
			self._getInputsByName(container, $(this).attr('data-form-name')).each(function(){
				this.checked = ($(this).attr('value') == value);
			});
		},

		/**
		 * Execute constructors within the given container.
		 * Non-recursive.
		 */
		_processConstructors : function(data, container){
			var self = this;
			this._findNoRecursive(container, '[data-form-constructor]').each(function(){
				var constructor = self.options.constructors[$(this).attr('data-form-constructor')];
				if (typeof(constructor)!='function') throw "constructor not a function: "+$(this).attr('data-form-constructor');
				if ($(this).is('[data-form-group]')) {
					var group = $(this).attr('data-form-group');
					if (data.hasOwnProperty(group)) {
						constructor.call(this, data[group]);
					} else {
						constructor.call(this);
					}
				} else {
					constructor.call(this, data);
				}
			});
		},

		_setContainerData : function(data, container){
			var self = this;
			Object.keys(data).forEach(function(key){
				if (Array.isArray(data[key])) {
					// data is array
					self._getInputsByName(container, key).val(data[key]);
				} else {
					var value = data[key];
					switch (typeof(value)) {
					case "object":
						// find group container with matching name and apply recursion
						self._getFormGroupByName(container, key).each(function(){
							self.setData(value, $(this));
						});
						break;
					case "undefined": // treat as empty string
						value = "";
					case "string":
					case "number":
					case "boolean":
						self._getInputsByName(container, key).each(function(){
							switch (this.tagName.toLowerCase()) {
							case "select":
								$(this).val(value);
								break;
							case "input":
								switch (this.type.toLowerCase()) {
								case "checkbox":
									this.checked = !!value;
									break;
								case "radio":
									// warning - this ignores radio buttons with identical names and ticks them all
									this.checked = (this.value==value);
									break;
								default:
									$(this).val(value);
								}
								break;
							case "textarea":
								$(this).val(value);
								break;
							}
						});
						break;
					}
				}
			});
		},

		setData : function(data, container){
			if (typeof(container)=='undefined') container = this.element;
			this._processConstructors(data, container);
			this.element.find('[data-form-for]').css('cursor', 'default')
				.off('click', this._labelClickHandler)
				.on('click', this, this._labelClickHandler);
			this.element.find('input[type="radio"]')
				.off('change', this._radioClickHandler)
				.on('change', this, this._radioClickHandler);
			this._setContainerData(data, container);
		},

		getData : function(container){
			if (typeof(container)=='undefined') container = this.element;

			var self = this;
			var data = {};

			this._findNoRecursive(container, 'input,select,textarea').filter('[data-form-name]').each(function(){
				var val = null;
				if (this.tagName.toLowerCase()=='input') {
					switch (this.type.toLowerCase()) {
					case 'checkbox':
						val = this.checked;
						break;
					case 'radio':
						if (this.checked) {
							val = this.value;
						} else {
							return;
						}
						break;
					default:
						val = $(this).val();
						break;
					}
				} else {
					val = $(this).val();
				}
				var attr = $(this).attr('data-form-name');
				if (attr.match(/\[\]$/)) { // ends with []
					attr = attr.substr(0, attr.length - 2); // remove last 2 chars
					if (!Array.isArray(data[attr])) {
						data[attr] = [];
					}
					data[attr].push(val);
				} else {
					data[attr] = val;
				}
			});

			this._findNoRecursive(container, '[data-form-group]').each(function(){
				var attr = $(this).attr('data-form-group');
				if (attr.match(/\[\]$/)) { // ends with []
					attr = attr.substr(0, attr.length - 2); // remove last 2 chars
					if (!Array.isArray(data[attr])) {
						data[attr] = [];
					}
					data[attr].push(self.getData($(this)));
				} else {
					data[attr] = self.getData($(this));
				}
			});

			return data;
		}
	});

})(jQuery);
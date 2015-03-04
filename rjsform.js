
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
		 * Given a subcontainer and data object, and based on the data-form-name attributes of parent elements,
		 * find the data object that's meant for the given subcontainer.
		 * May return null.
		 * TODO: support [] name suffix
		 */
		/* NOT USED ATM
		_findContainerData : function(container, data){
			if (container.size()==0) return null;
			if (container.size()>1) container = container.first();
			var parents = [];
			container.parentsUntil(this.element, '[data-form-name]').each(function(){
				parents.unshift(this);
			});
			if (container.is('[data-form-name]')) {
				parents.unshift(container[0]);
			}
			result = data;
			parents.forEach(function(p){
				if (result===null) return;
				var key = $(this).attr('data-form-name');
				if (typeof(result[key])=='undefined') {
					result = null;
				} else {
					result = result[key];
				}
			});
			return result;
		},*/

		/**
		 * Find elements matching the selector without going into [data-form-name] elements.
		 * Takes care of [data-form-ignore]
		 */
		_findNoRecursive : function(element, selector){
			return element.find(selector).filter(function(){
				if ($(this).parentsUntil(element, '[data-form-name]').size()>0) {
					return false;
				}
				if ($(this).parentsUntil(element, '[data-form-ignore]').size()>0) {
					return false;
				}
				if ($(this).is('[data-form-ignore]')) {
					return false;
				}
				return true;
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
			return this._findNoRecursive(container, '[data-form-name]')
				.filter(function(){
					return $(this).attr('data-form-name')==name;
				});
		},

		/**
		 * Handles label clicking by moving focus to the referenced input
		 */
		_labelClickHandler : function(event){
			var self = event.data;
			// try to find container
			var container = self.element.find($(this).closest('[data-form-name]'));
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
			var container = self.element.find($(this).closest('[data-form-name]'));
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
				if ($(this).is('[data-form-name]')) {
					var group = $(this).attr('data-form-name');
					if (data.hasOwnProperty(group)) {
						constructor.call(this, data[group]);
					} else {
						constructor.call(this, {});
					}
				} else {
					constructor.call(this, data);
				}
			});
		},

		/**
		 * When a data object is actually an array
		 */
		_setContainerDataArray : function(container, name, data){
			var self = this;
			// also take care of select[multiple] controls
			this._setElementValue(this._getInputsByName(container, name).filter('select[multiple]'), data);
			// support both name[] and name > [] simultaneously by combining all elements in one list
			var elements = this._findNoRecursive(container, '[data-form-name="'+name+'[]"]');
			elements = elements.add(this._findNoRecursive(this._findNoRecursive(container, '[data-form-name="'+name+'"]'), '[data-form-name="[]"]'));
			var index = 0;
			elements.each(function(){
				if (index >= data.length) return false;
				if ($(this).is('input,select,textarea')) {
					self._setElementValue($(this), data[index]);
				} else if (!Array.isArray(data[index]) && typeof(data[index])=='object') {
					self.setData(data[index], $(this));
				}
				index++;
			});
		},

		/**
		 * When we know element contains only input elements (input,select,textarea), we use this.
		 */
		_setElementValue : function(element, value){
			element.each(function(){
				//console.log(this, value);
				switch (this.tagName.toLowerCase()) {
					case "select":
					case "textarea":
						$(this).val(value);
						break;
					case "input":
						switch (this.type.toLowerCase()) {
						case "checkbox":
							this.checked = !!value;
							break;
						case "radio":
							// warning - this ignores radio buttons with identical name/value and ticks them all
							this.checked = (this.value==value);
							break;
						default:
							$(this).val(value);
						}
						break;
					default:
						// ignore
				}
			});
		},

		/**
		 * Fills inputs within the container, without going into form groups.
		 * "data" is always assumed to be an object - make sure it really is.
		 */
		_setContainerData : function(data, container){
			var self = this;
			Object.keys(data).forEach(function(key){
				if (Array.isArray(data[key])) {
					// data is array
					self._setContainerDataArray(container, key, data[key]);
				} else {
					var value = data[key];
					switch (typeof(value)) {
					case "object":
						// find group container with matching name and apply recursion
						self._getFormGroupByName(container, key).first().each(function(){
							self.setData(value, $(this));
						});
						break;
					case "undefined": // treat as empty string
						value = "";
					case "string":
					case "number":
					case "boolean":
						self._setElementValue(self._getInputsByName(container, key), value);
						break;
					}
				}
			});
		},

		setData : function(data, container){
			// if no container specified, use root element
			if (typeof(container)=='undefined') container = this.element;
			// let constructors build the form
			this._processConstructors(data, container);
			// prepare input labels
			this._findNoRecursive(this.element, '[data-form-for]').css('cursor', 'default')
				.off('click', this._labelClickHandler)
				.on('click', this, this._labelClickHandler);
			// prepare radio groups
			this._findNoRecursive(this.element, 'input[type="radio"]')
				.off('change', this._radioClickHandler)
				.on('change', this, this._radioClickHandler);
			// set data recursively
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

			this._findNoRecursive(container, '[data-form-name]').each(function(){
				var attr = $(this).attr('data-form-name');
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
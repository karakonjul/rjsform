jQuery(function($){

	var demo_constructor = function(data){
		var template = $(this).find('.item-template').first();
		var list = template.parent();
		template.hide();
		list.children().not(template).remove();
		try {
			Object.keys(data).forEach(function(key){
				var item = template.clone();
				item
					.find('input')
					.attr('data-form-name', key)
					.val(data[key])
					.end()
					.find('.title')
					.text(key)
					.end()
					.appendTo(list)
					.removeClass('item-template')
					.show();
			});
		} catch (error) {
			console.log(error);
		}
	}; // demo_constructor

	var demo_constructor_2 = function(data){
		var template = $(this).find('.item-template').first();
		var list = template.parent();
		template.hide();
		list.children().not(template).remove();
		if (!Array.isArray(data)) return;
		try {
			data.forEach(function(key){
				var item = template.clone();
				item
					.appendTo(list)
					.removeClass('item-template')
					.removeAttr('data-form-ignore')
					.show();
			});
		} catch (error) {
			console.log(error);
		}
	}; // demo_constructor_2

	var demo_data = {
		nonexistent : "bla",
		normalinput : 'test',
		singleselect : 2,
		multiselect : [1,3],
		checkbox : true,
		radio : 3,
		constructor_data : {
			v1 : 'v1 value',
			v2 : 'v2 value',
			v3 : 'v3 value'
		},
		constructor_data_2 : [
			{"enabled":true,"type":2,"value":"blabla"},
			{"enabled":true,"type":1,"value":"hohoho"},
			{"enabled":false,"type":3,"value":"leleee"},
			{"enabled":false,"type":2,"value":"maleee"}
		],
		group1 : {
			normalinput : 'test group',
			singleselect : 3,
			multiselect : [2],
			checkbox : false,
			radio : 1
		},
		group2 : [
			{tick:true,  rd:1},
			{tick:false, rd:2},
			{tick:true,  rd:3}
		]
	}; // demo_data

	$('#form_container').rjsform({
		data : {},
		constructors : {
			demo_constr : demo_constructor,
			demo_constr_2 : demo_constructor_2
		}
	});

	$('#form_container').rjsform('setData', demo_data);

	// auto get data on form change
	$('#form_container').on('change', 'input,select,textarea', function(event){
		$('#json_viewer textarea[name="json"]').val(
			JSON.stringify($('#form_container').rjsform('getData'), null, '  '));
	});

	// get data
	$('#json_viewer input[name="get"]').click(function(){
		$('#json_viewer textarea[name="json"]').val(
			JSON.stringify($('#form_container').rjsform('getData'), null, '  '));
	});

	// set data
	$('#json_viewer input[name="set"]').click(function(){
		try {
			var data = JSON.parse($('#json_viewer textarea[name="json"]').val());
			$('#form_container').rjsform('setData', data);
		} catch (error) {
			console.log(error);
		}
	});

});
$(function(){
	var xhr = require('./xhr');
	//var callMeBackRef = new Firebase('https://madebymark.firebaseio.com/levenincompassie/callmeback');
	var phoneRegex = /^0[0-9]{9}$/;
	var $name = $('.callmeback-name');
	var $number = $('.callmeback-number');
	var $button = $('.callmeback-btn');
	var $form = $('.callmeback-form');

	function ok(){
		$button
			.attr('disable',true)
		    .removeClass('btn-default')
			.addClass('btn-success disabled')
			.text('Bedankt!');
	}

	function fail(){
		alert('Er ging iets mis. Probeer opnieuw.');
	}

	$button.click(function(){
		if(validate()){
			if(ga) ga('send', 'event', 'button', 'click', 'callmeback');
			var name = $name.val();
			var number = $number.val();
			var data = {
				name: name || "",
				number: number || ""
			};
			
			xhr('POST https://hooks.zapier.com/hooks/catch/164397/1dxz2/',data).then(ok,fail);

			// callMeBackRef.push(,function(err){
			// 	if(err){
			// 		fail();
			// 	} else {
			// 		ok();
			// 	}
			// });	

			trackVar('name',1,name);
			localStorage.setItem('number',number);
		}
	});

	$name.on('keyup',validate);
	$number.on('keyup',validate);

	function validate(){
		var number = $number.val().replace(/ /g,'');
		var valid = phoneRegex.test(number) && $name.val().length > 0;

		if(valid){
			$button.removeClass('disabled');
			$button.attr('disable',null);	
		} else {
			$button.addClass('disabled');
			$button.attr('disable',true);	
		}
		return valid;
	}
});
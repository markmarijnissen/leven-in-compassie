$(function(){
	var callMeBackRef = new Firebase('https://madebymark.firebaseio.com/levenincompassie/callmeback');
	var phoneRegex = /^0[0-9]{9}$/;
	var $name = $('.callmeback-name');
	var $number = $('.callmeback-number');
	var $button = $('.callmeback-btn');
	var $form = $('.callmeback-form');

	$button.click(function(){
		if(validate()){
			if(ga) ga('send', 'event', 'button', 'click', 'callmeback');
			var name = $name.val();
			var number = $number.val();
			
			callMeBackRef.push({
				name: name || "",
				number: number || ""
			},function(err){
				if(err){
					alert('Er ging iets mis. Probeer opnieuw.');
				} else {
					$button
						.attr('disable',true)
					    .removeClass('btn-default')
						.addClass('btn-success disabled')
						.text('Bedankt!');
				}
			});	

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
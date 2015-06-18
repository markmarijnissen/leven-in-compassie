$(function(){
	var emailRef = new Firebase('https://madebymark.firebaseio.com/levenincompassie/email');
	var emailRegex = /^.+@.+\.[a-z]{2,10}$/;
	var $button = $('.email-btn');

	var $name = $('.email-name');
	var $email = $('.email-email');
	var $subject = $('.email-subject');
	var $message = $('.email-message');

	var $form = $('.email-form');

	$button.click(function(){
		if(validate()){
			emailRef.push({
				name: $name.val() || "",
				email: $email.val() || "",
				subject: $subject.val() || "",
				message: $message.val() || ""
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
		}
	});

	$form.on('keyup',validate);

	function validate(){
		var valid = emailRegex.test($email.val()) && $name.val().length > 0 && $message.val().length > 0;
		if(valid){
			$button.removeClass('disabled');	
		} else {
			$button.addClass('disabled');
		}
		return valid;
	}
});
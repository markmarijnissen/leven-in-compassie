$(function(){
	var xhr = require('./xhr');
	//var emailRef = new Firebase('https://madebymark.firebaseio.com/levenincompassie/email');
	var emailRegex = /^.+@.+\.[a-z]{2,10}$/;
	var $button = $('.email-btn');

	var $name = $('.email-name');
	var $email = $('.email-email');
	var $subject = $('.email-subject');
	var $message = $('.email-message');

	var $form = $('.email-form');

	function fail(){
		alert('Er ging iets mis. Probeer opnieuw.');
	}
	function ok(){
		$button
				.attr('disable',true)
			    .removeClass('btn-default')
				.addClass('btn-success disabled')
				.text('Bedankt!');
	}

	$button.click(function(){
		if(validate()){
			if(ga) ga('send', 'event', 'button', 'click', 'email');
			var name = $name.val();
			var email = $email.val();
			var data = {
				name: name || "",
				email: email || "",
				subject: $subject.val() || "",
				message: $message.val() || ""
			};

			xhr('POST https://hooks.zapier.com/hooks/catch/164397/4pscyt/',data).then(ok,fail);

			// emailRef.push(data,function(err){
			// 	if(err){
			// 		fail();
			// 	} else {
			// 		ok();
			// 	}
			// });	
			
			trackVar('name',1,name);
			trackVar('email',2,email);
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
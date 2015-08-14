window.$ = window.jQuery = require('jquery');
require('./firebase');
require('./layout');
require('./theme/style.less');
require('./bootstrap/js/dropdown');
require('./callmeback.js');
require('./email.js');
require('./order.js');
require('./mouseflow');
require('./trackVar');

$(function(){
	$select = $('#navselect');
	$select.val(location.pathname);
	$select.change(function(){
		location.pathname = $select.val();
	});
	var name = localStorage.getItem('name');
	var email = localStorage.getItem('email');

	$('.email-name,.callmeback-name').val(name);
	$('.email-email').val(email);
	$('#tlemail').val(email);

	if(name) _mfq.push(["setVariable", "name", name]);
	if(email) _mfq.push(["setVariable", "email",email]);

	// newsletter event tracking;
	$('.newsletter').click(function(ev){
		if(ga) ga('send', 'event', 'button', 'click', 'newsletter');
		trackVar('email',2,$('#tlemail').val());
	});

	$('.menu').click(function(){
		$('.menu-select').focus();
	});
});
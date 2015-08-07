window.$ = window.jQuery = require('jquery');
require('./firebase');
require('./layout');
require('./theme/style.less');
require('./bootstrap/js/dropdown');
require('./callmeback.js');
require('./email.js');
require('./order.js');

$(function(){
	$select = $('#navselect');
	$select.val(location.pathname);
	$select.change(function(){
		location.pathname = $select.val();
	});

	var email = JSON.parse(localStorage.getItem('order-data') || '{"email":""}').email;
	$('.email-email').val(email);
	var name = JSON.parse(localStorage.getItem('order-data') || '{"name":""}').name;
	$('.email-name').val(name);
});
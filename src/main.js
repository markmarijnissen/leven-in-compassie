window.$ = window.jQuery = require('jquery');
require('./layout');
require('./theme/style.less');
require('./bootstrap/js/dropdown');
require('./callmeback.js');
require('./email.js');

$(function(){
	$select = $('#navselect');
	$select.val(location.pathname);
	$select.change(function(){
		location.pathname = $select.val();
	});
});
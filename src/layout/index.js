var $ = require('jquery');
window.requestAnimationFrame = window.requestAnimationFrame || require('raf');
require('polyfill-function-prototype-bind');
require('./classList');
require('./headroom');
require('./layout.less');
$(function(){

	var offset = $('.headerimg img').height() || 100;
	var docHeight = $(document).height();
	var winHeight = $(window).height();


	// HeadRoom
	var navbar = $('#navbar').get(0);
	if(docHeight > winHeight + 500){
		var headroom  = new Headroom(navbar,{
			tolerance: {
				up: 5,
				down: 10
			},
			offset: offset
		});
		headroom.init();
	}
});
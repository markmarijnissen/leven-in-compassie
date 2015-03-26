var $ = require('jquery');
window.requestAnimationFrame = window.requestAnimationFrame || require('raf');
require('polyfill-function-prototype-bind');
require('./classList');
require('./headroom');
require('./layout.less');
$(function(){

	// HeadRoom
	var navbar = $('#navbar').get(0);
	var headroom  = new Headroom(navbar,{
		tolerance: {
			up: 5,
			down: 10
		},
		offset: 100
	});
	headroom.init();
});
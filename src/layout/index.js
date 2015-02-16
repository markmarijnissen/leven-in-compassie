// Expecting following content:
// 
// #wrapper
// 		#sidebar-wrapper
// 			#sidebar
// 		#content-wrapper
// 			#navbar
// 			#layout
//				#content

var $ = require('jquery');
window.requestAnimationFrame = window.requestAnimationFrame || require('raf');
require('polyfill-function-prototype-bind');
require('./classList');
require('./headroom');
require('./layout.less');
$(function(){
	// Toggle Menu
	$('body').on('click touchstart','.toggle-menu',function(e) {
	    e.preventDefault();
	    $("#wrapper").toggleClass("menu-opened");
		console.log('toggle!');
	});

	// $('body').on('mouseover','.toggle-menu',function(e) {
	//     e.preventDefault();
	//     $("#wrapper").addClass("menu-opened");
	//     console.log('open!');
	// });
	
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
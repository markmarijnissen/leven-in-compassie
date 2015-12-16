require('./reveal.less');
require('./lib/js/head.min.js');
require('./lib/js/html5shiv.js');
var Reveal = window.Reveal = require('./js/reveal.js');

$(function(){
  Reveal.initialize({
    width: 640 * 1.2,
    height: 480 * 1.2,
    margin: 0,
    minScale: 0.5,
    maxScale: 1.5,
    controls: false,
    progress: true,
    history: true,
    center: true,
    mouseWheel: true,
    backgroundTransition: 'fade',
    transition: 'slide', // none/fade/slide/convex/concave/zoom
  });

  $('body')
    .addClass('revealjs')
    .keypress(function(ev){
      if(ev.keyCode === 109){
          $('#navbar').toggleClass('hidden');
      }
    });

  require('./plugin/zoom-js/zoom.js');
}); 


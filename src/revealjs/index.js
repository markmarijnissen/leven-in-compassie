require('./reveal.less');
require('./lib/js/head.min.js');
require('./lib/js/html5shiv.js');
var Reveal = require('./js/reveal.js');

$(function(){
  Reveal.initialize({
    width: 640,
    height: 480,
    margin: 0,
    minScale: 0.2,
    maxScale: 1.5,
    controls: true,
    progress: true,
    history: true,
    center: true,
    mouseWheel: true,
    backgroundTransition: 'fade',
    transition: 'slide', // none/fade/slide/convex/concave/zoom
  });

  $('body').keypress(function(ev){
    if(ev.keyCode === 109){
        $('#navbar').toggleClass('hidden');
    }
  });

}); 


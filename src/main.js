window.$ = window.jQuery = require('jquery');
require('./firebase');
require('./layout');
require('./theme/style.less');
require('./bootstrap/js/dropdown');
require('./bootstrap/js/affix');
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

	$(window).on('hashchange',function(){
		setTimeout(function(){
			headroom.unpin();
		},0);
	});

	// Generate TOC
	$toc = $('#toc');
	if($toc){
		$h3 = $('h3[id],.anchor[title]');
		if($h3.length > 2){
			$toc.append($('<li><strong>Inhoud</strong></li>'));
			$h3.each(function(index,el){
				var text = $(el).text() || $(el).attr('title');
				var href = '#' + $(el).attr('id');
				console.log(href,text);
				$toc.append(
					$('<li></li>').append(
						$('<a></a>').text(text).attr('href',href)
					)
				);
			});	
		}
	}

	// MORE CLICKER
	$('a.more').click(function(){
		$('#more').removeClass('hidden');
		$('.more').remove();
		trackVar('clickmore',3,1);
	});
});
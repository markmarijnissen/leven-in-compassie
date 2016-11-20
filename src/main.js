window.$ = window.jQuery = require('jquery');
//require('./firebase');
require('./layout');
require('./theme/style.less');
require('./bootstrap/js/dropdown');
require('./bootstrap/js/affix');
require('./bootstrap/js/tooltip');
require('./bootstrap/js/modal');
require('./callmeback.js');
require('./email.js');
require('./order.js');
require('./mouseflow');
require('./trackVar');
var bootbox = require('bootbox');

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

	if(typeof headroom != 'undefined'){
		$(window).on('hashchange',function(){
			if(location.hash.length > 1){
				setTimeout(function(){
					headroom.unpin();
				},0);
			}
		});
	}

	$('.abbr').tooltip();

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

	// AANBOD click white vlak voor open
	$('.aanbod-header a').each(function(i,el) { 
		var href = $(el).attr('href'); 
		var $table = $(el).parent().parent().find('.table');
		$table.css({cursor:'pointer'});
		$table.click(function(){  
			location.href = href; 
		});  
	});

	// MORE CLICKER
	$('a.more').click(function(){
		$('#more').removeClass('hidden');
		$('.more').remove();
		trackVar('clickmore',3,1);
	});

	// PASSWORD
	if(location.pathname.substr(0,8) === '/cursus/'){
		var unlocked = sessionStorage.getItem('unlocked') ===  'true';
		if(unlocked){
			$('#layout').removeClass('password-protected');  
		} else {
			bootbox.prompt({
				'title':'Voer het wachtwoord in',
				'callback':function(result) {                
				  if (result === "empathie") {  
				  	sessionStorage.setItem('unlocked','true'); 
			    	$('#layout').removeClass('password-protected');    
				  } else {
				    location.pathname = "/";                         
				  }
				}
			});
		}
	}
});
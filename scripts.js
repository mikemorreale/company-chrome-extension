function start(sidebar) {
	var fa = document.createElement('style');
	fa.type = 'text/css';
	fa.textContent = '@font-face { font-family: FontAwesome; src: url("'
		+ chrome.extension.getURL('bower_components/font-awesome/fonts/fontawesome-webfont.woff')
		+ '"); }';
	document.head.appendChild(fa);
	$('body').prepend(sidebar);
	$('.cb-sidebar-close').click(function(){
		$('.cb-sidebar').remove();
	});
}
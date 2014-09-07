var evernoteHostName = 'https://sandbox.evernote.com';
var oauth = OAuth({
    consumerKey: 'dkman94-0573',
    consumerSecret: '6c5908415ba011a9',
    callbackUrl: document.URL + '?company-chrome-extension=true',
    signatureMethod: 'HMAC-SHA1',
});
var oauthToken;
var noteStoreUrl;

function init(sidebar) {
  var fa = document.createElement('style');
  fa.type = 'text/css';
  fa.textContent = '@font-face { font-family: FontAwesome; src: url("'
    + chrome.extension.getURL('bower_components/font-awesome/fonts/fontawesome-webfont.woff')
    + '"); }';
  document.head.appendChild(fa);

  $('body').prepend(sidebar);

  getCrunchbaseFromUrl(window.location.hostname);

  setTimeout(function () {
    $('.cb-sidebar').removeClass('hidden');
  }, 200);

  $('.cb-sidebar-close').click(function () {
    $('.cb-sidebar').addClass('hidden');

    setTimeout(function () {
      $('.cb-sidebar').remove();
    }, 500);
  });

  var url = document.URL;
  if (url.indexOf('company-chrome-extension') > -1) {
    var oauthVerifier;
    var oauthToken;

    var vars = url.split('&');
    for (var i = 0; i < vars.length; i++) {
      var y = vars[i].split('=');
      if (y[0] === 'oauth_verifier') {
        oauthVerifier = y[1];
      } else if (y[0] === 'oauth_token') {
        oauthToken = y[1];
      }
    }

    if (oauthVerifier && oauthToken) {
      oauth.setVerifier(oauthVerifier);
      oauth.setAccessToken([oauthToken, localStorage.getItem("oauth_token_secret")]);

      oauth.request({'method': 'GET', 'url': evernoteHostName + '/oauth', 'success': success, 'failure': failure});
    }
  }

  $('.cb-authorize-evernote').click(function () {
    oauth.request({'method': 'GET', 'url': evernoteHostName + '/oauth', 'success': success, 'failure': failure});
  });
  
  $('.create-note').click(function () {
    var noteTitle = $('.evernote-title').text();
    var noteBody = $('.evernote-body').text();

    createNote(noteStoreUrl, noteTitle, noteBody, null, function (note) {});
  });

  showEvernoteButton();
}

function showEvernoteButton() {
  if (localStorage.getItem('oauth_token_secret')) {
    $('.cb-authorize-evernote').show();
    $('.create-note').show();
  }
}

function createNote(noteStore, noteTitle, noteBody, parentNotebook, callback) {
  var nBody = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
  nBody += "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">";
  nBody += "<en-note>" + noteBody + "</en-note>";
 
  // Create note object
  var ourNote = new Evernote.Note();
  ourNote.title = noteTitle;
  ourNote.content = nBody;
 
  // parentNotebook is optional; if omitted, default notebook is used
  if (parentNotebook && parentNotebook.guid) {
    ourNote.notebookGuid = parentNotebook.guid;
  }
 
  // Attempt to create note in Evernote account
  noteStore.createNote(ourNote, function (err, note) {
    if (err) {
      // Something was wrong with the note data
      // See EDAMErrorCode enumeration for error code explanation
      // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
      console.log(err);
    } else {
      callback(note);
    }
  });
}

function success(data) {
  var isCallBackConfirmed = false;
  var token = '';

  var vars = data.text.split('&');
  for (var i = 0; i < vars.length; i++) {
    var y = vars[i].split('=');

    if (y[0] === 'oauth_token') {
      token = y[1];
    } else if (y[0] === 'oauth_token_secret') {
      this.oauth_token_secret = y[1];
      localStorage.setItem('oauth_token_secret', y[1]);
    } else if (y[0] === 'oauth_callback_confirmed') {
      isCallBackConfirmed = true;
    }
  }

  if (isCallBackConfirmed) {
    window.location = evernoteHostName + '/OAuth.action?oauth_token=' + token, '_blank';
  } else {
    var vars = data.text.split('&');
    for (var i = 0; i < vars.length; i++) {
      var y = vars[i].split('=');
      if (y[0] === 'oauth_token') {
        oauthToken = decodeURIComponent(y[1]);
      } else if (y[0] === 'edam_noteStoreUrl') {
        noteStoreUrl = decodeURIComponent(y[1]);
      }
    }
  }
}

function failure(error) {
  console.log('error: ' + error.text);
}


function getCrunchbaseFromUrl(url_query){
	var apiKey = 'a554e04effee9e09ee61679a344041c2';
	var lookupUrlPrefix = 'http://api.crunchbase.com/v/2/organizations?query=';
	var lookupUrlPrefix2 = 'http://api.crunchbase.com/v/2/';
	var url = lookupUrlPrefix + url_query + '&user_key=' + apiKey;
	$.ajax({ 
		url: url,
		type: 'GET',
		dataType: 'json',
		success: function(data) {
			// if found for URL, go get the actual data
			console.log(data);
			try {
				var path = data['data']['items'][0]['path']
			} catch(err) {
				var path = 0;
			}
			if (path == 0) {
				// NOT FOUND
			} else {
				var url2 = lookupUrlPrefix2 + path + '?user_key=' + apiKey;
				$.ajax({ 
					url: url2,
					type: 'GET',
					dataType: 'json',
					success: function(data) {
						FillCrunchbaseData(data);
					}
				});
			}
		}
	});
}

function FillCrunchbaseData(data) {
	console.log(data);
	$('.cb-loading-circle').hide();
	var return_object = ParseCrunchbaseData(data);
	var final_html = CreateCrunchbaseHTML(return_object);
	$(".cb-loaded-data").html(final_html);
	$(".companyImgdiv").remove();
	$(".cb-title-info").remove();
	AddCrunchbaseNews(data);
}

function AddCrunchbaseNews(data) {
	var news = data['data']['relationships']['news']['items'];
	var press_table = '<div class="cb-header">Recent News</div><table class="cb-newsTable">';
	$.each(news,function(index,value){
		var title = value['title'];
		var url = value['url'];
		var date = value['posted_on'];
		press_table += '<tr><td width="60">' + date + '</td><td><a href="' + url + '" target="_blank">' + title + '</a></td></tr>';
		return index<2;
	});
	press_table+= '</table>';
	$('.cb-loaded-data').append(press_table);
}
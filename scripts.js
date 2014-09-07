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

  $('.cb-sidebar').show();
  $('.cb-sidebar-close').click(function () {
    $('.cb-sidebar').remove();
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


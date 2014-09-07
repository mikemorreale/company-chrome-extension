var evernoteHostName = 'https://sandbox.evernote.com';
var oauth = OAuth({
    consumerKey: 'dkman94-0573',
    consumerSecret: '6c5908415ba011a9',
    callbackUrl: document.URL + '?company-chrome-extension=true',
    signatureMethod: 'HMAC-SHA1',
});
var authToken;
var noteStoreUrl;

function init(sidebar) {
  var fa = document.createElement('style');
  fa.type = 'text/css';
  fa.textContent = '@font-face { font-family: FontAwesome; src: url("'
    + chrome.extension.getURL('bower_components/font-awesome/fonts/fontawesome-webfont.woff')
    + '"); }';
  document.head.appendChild(fa);

  $('body').prepend(sidebar);

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
    var data = {
      authToken: authToken,
      title: $('.evernote-title').val(),
      body: $('.evernote-body').val()
    };

    $.ajax({
      url: 'http://localhost:1337/note',
      type: 'POST',
      data: data
    });
  });

  showEvernoteButton();
}

function showEvernoteButton() {
  if (localStorage.getItem('oauth_token_secret')) {
    $('.cb-authorize-evernote').show();
    $('.create-note').show();
  }
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
        authToken = decodeURIComponent(y[1]);
      } else if (y[0] === 'edam_noteStoreUrl') {
        noteStoreUrl = decodeURIComponent(y[1]);
      }
    }
  }
}

function failure(error) {
  console.log('error: ' + error.text);
}


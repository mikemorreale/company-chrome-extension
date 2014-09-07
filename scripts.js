function start(sidebar) {
  var fa = document.createElement('style');
  fa.type = 'text/css';
  fa.textContent = '@font-face { font-family: FontAwesome; src: url("'
    + chrome.extension.getURL('bower_components/font-awesome/fonts/fontawesome-webfont.woff')
    + '"); }';
  document.head.appendChild(fa);
  $('body').prepend(sidebar);
  $('.cb-sidebar').show();
  $('.cb-sidebar-close').click(function(){
    $('.cb-sidebar').remove();
  });
  $('.cb-authorize-evernote').click(function(){
    authorizeEvernote();
  });
}

function authorizeEvernote() {
  var hostName = 'https://sandbox.evernote.com';
  var options = {
      consumerKey: 'dkman94-0573',
      consumerSecret: '6c5908415ba011a9',
      callbackUrl : 'gotOAuth.html',
      signatureMethod : 'HMAC-SHA1',
  };
  var oauth = OAuth(options);
  oauth.request({'method': 'GET', 'url': hostName + '/oauth', 'success': success, 'failure': failure});

  function success(data) {
    var isCallBackConfirmed = false;
    var token = '';
    var vars = data.text.split("&");
    for (var i = 0; i < vars.length; i++) {
        var y = vars[i].split('=');
        if(y[0] === 'oauth_token')  {
            token = y[1];
        }
        else if(y[0] === 'oauth_token_secret') {
            this.oauth_token_secret = y[1];
            localStorage.setItem("oauth_token_secret", y[1]);
        }
        else if(y[0] === 'oauth_callback_confirmed') {
            isCallBackConfirmed = true;
        }
    }
    var ref;
    if(isCallBackConfirmed) {
        // step 2
        ref = window.open(hostName + '/OAuth.action?oauth_token=' + token, '_blank');
        ref.addEventListener('loadstart',
            function(event) {
                var loc = event.url;
                if (loc.indexOf(hostName + '/Home.action?gotOAuth.html?') >= 0) {
                    var index, verifier = '';
                    var got_oauth = '';
                    var params = loc.substr(loc.indexOf('?') + 1);
                    params = params.split('&');
                    for (var i = 0; i < params.length; i++) {
                        var y = params[i].split('=');
                        if(y[0] === 'oauth_verifier') {
                            verifier = y[1];
                        }
                    }
                } else if(y[0] === 'gotOAuth.html?oauth_token') {
                    got_oauth = y[1];
                }
                // step 3
                oauth.setVerifier(verifier);
                oauth.setAccessToken([got_oauth, localStorage.getItem("oauth_token_secret")]);

                var getData = {'oauth_verifier':verifier};
                ref.close();
                oauth.request({'method': 'GET', 'url': hostName + '/oauth',
                    'success': success, 'failure': failure});
            }
        );
    } else {
        // Step 4 : Get the final token
        var querystring = getQueryParams(data.text);
        var authTokenEvernote = querystring.oauth_token;
        // authTokenEvernote can now be used to send request to the Evernote Cloud API
        
        // Here, we connect to the Evernote Cloud API and get a list of all of the
        // notebooks in the authenticated user's account:
        var noteStoreURL = querystring.edam_noteStoreUrl;
        var noteStoreTransport = new Thrift.BinaryHttpTransport(noteStoreURL);
        var noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport);
        var noteStore = new NoteStoreClient(noteStoreProtocol);
        noteStore.listNotebooks(authTokenEvernote, function (notebooks) {
            console.log(notebooks);
        },
        function onerror(error) {
          console.log(error);
        });
    }
  }

  function failure(error) {
    console.log('error ' + error.text);
  }
}
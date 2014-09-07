var evernoteHostName = 'https://sandbox.evernote.com';
var oauth = OAuth({
  consumerKey: 'dkman94-0573',
  consumerSecret: '6c5908415ba011a9',
  callbackUrl: document.URL + '?company-chrome-extension=true',
  signatureMethod: 'HMAC-SHA1',
});
var authToken = localStorage.getItem('auth_token');

function init(sidebar) {
  fontAwesomeSetup();

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

  if (authToken) {
    $('.cb-authorize-evernote').hide();
    $('.create-note').show();

    evernoteSetup();
  }
}

function fontAwesomeSetup() {
  var fa = document.createElement('style');
  fa.type = 'text/css';
  fa.textContent = '@font-face { font-family: FontAwesome; src: url("'
    + chrome.extension.getURL('bower_components/font-awesome/fonts/fontawesome-webfont.woff')
    + '"); }';
  document.head.appendChild(fa);
}

function evernoteSetup() {
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
        localStorage.setItem('auth_token', y[1]);
      }
    }
  }
}

function failure(error) {
  console.log('error: ' + error.text);
}

function getCrunchbaseFromUrl(url_query) {
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
      try {
        var path = data['data']['items'][0]['path']
      } catch (err) {
        var path = 0;
      }
      if (path === 0) {
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
  $('.cb-loading-circle').hide();
  var return_object = ParseCrunchbaseData(data);
  var final_html = CreateCrunchbaseHTML(return_object);
  $(".cb-loaded-data").html(final_html);
  $(".companyImgdiv").remove();
  $(".cb-title-info").remove();
  AddCrunchbaseNews(data);
  AddHQWeather(data);
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

function AddHQWeather(data) {
  try {
    var hq = data['data']['relationships']['headquarters']['items'][0];
    var state = hq['region'];
    var city = hq['city'];
    getCurrentWeather(state, city);
  } catch(err) {}
}

function getCurrentWeather(state, city) {
  var url = 'https://api.wunderground.com/api/15b4b28fc860cf69/conditions/q/'+ state +'/' + city + '.json';
  $.ajax({ 
    url: url,
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      var weather = data['current_observation'];
      var icon_url = weather['icon_url'];
      var current_temp = weather['temp_f'];
      var forecast_url = weather['forecast_url'];
      var weather_html = '<img src="' + icon_url + '" style="width:25px;vertical-align:middle;"/>';
      weather_html += '<a href="' + forecast_url + '" target="_blank" class="wu-cb-styles">&nbsp;' + current_temp + '&#176;&nbsp; by <img src="http://icons.wxug.com/graphics/wu2/logo_130x80.png" style="width:25px;vertical-align:middle;"></a> ';
      $(".cb-hq-text").parent().append(weather_html);
    }
  });
}

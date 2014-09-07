chrome.browserAction.onClicked.addListener(function () {
  var sidebar = $('.sidebar').load('sidebar.html').html().trim().replace(/(\r\n|\n|\r)/gm,"");

  chrome.tabs.executeScript(null, {
    code: 'start(\'' + sidebar + '\')'
  });
});

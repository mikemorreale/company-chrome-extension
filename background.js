chrome.browserAction.onClicked.addListener(function () {
  var sidebar = $('.sidebar').load('sidebar.html').html().trim();

  chrome.tabs.executeScript(null, {
    code: 'start(\'' + sidebar + '\')'
  });
});

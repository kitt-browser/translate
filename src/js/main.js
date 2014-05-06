"use strict";

var $ = require('../vendor/jquery/jquery');
var _ = require('../vendor/underscore/underscore');

$.support.cors = true; 

var menu = chrome.contextMenus.create({
  id: "translatorContextMenu",
  title: 'FOOBAR',
  contexts : ['selection'],
  enabled: true
});

chrome.contextMenus.onClicked.addListener(function(info) {
  if (info.menuItemId !== menu) {
    return;
  }
  $.get('https://www.googleapis.com/language/translate/v2', {
    key: 'AIzaSyBIR5kt0HcaEU4ObATY5HrForJgV0K_RiI',
    target: 'en',
    source: 'cs',
    q: info.selectionText
  }, function(data) {
    data = JSON.parse(data);
    sendMessage({text: data.data.translations[0].translatedText});
  }).fail(function(err) {
    console.log('error', err);
  });
});


function sendMessage(msg) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('sending message to', tabs[0], msg);
    chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
      console.log(response);
    });
  });
}

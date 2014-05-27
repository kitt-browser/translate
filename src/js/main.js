"use strict";

var $ = require('../vendor/jquery/jquery');
var _ = require('../vendor/underscore/underscore');
var common = require('./common');

$.support.cors = true; 

var menu = chrome.contextMenus.create({
  id: "translatorContextMenu",
  title: 'Translate',
  contexts : ['selection'],
  enabled: true
});

chrome.contextMenus.onClicked.addListener(function(info) {
  if (info.menuItemId !== menu) {
    return;
  }
  common.getFromStorage('sourceLang', function(lang) {
    translate(info.selectionText, (lang || null), 'en', function(err, data) {
      if (err) {
        console.log('error:', err);
        return sendMessage({err: err});
      }
      sendMessage({
        event: 'translation:finished',
        err: null,
        originalText: info.selectionText,
        text: data.data.translations[0].translatedText
      });
    });
  });
});


function translate(text, sourceLang, targetLang, callback) {
  targetLang = targetLang || 'en';
  sourceLang = sourceLang || null;

  sendMessage({event:'translation:loading'});

  console.log('translate', sourceLang, targetLang);

  var params = {
    target: targetLang,
    q: text
  };

  if (sourceLang != 'auto') {
    params.source = sourceLang;
  }

  console.log('params to google API', params);

  $.get('http://google-translate-proxy-dev.salsitasoft.com/translate', params, function(data) {
    console.log('google api success');
    data = JSON.parse(data);
    callback(null, data);
  }).fail(function(err) {
    console.log('error', err);
    callback(err);
  });
}


function sendMessage(msg) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('sending message to', tabs[0], msg);
    chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
      console.log(response);
    });
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch(request.command) {
    case 'loadLanguage':
      common.getFromStorage('sourceLang', function(lang) {
        sendResponse(lang);
      });
      return true;
    case 'translate':
      console.log('translating...');
      translate(request.text, request.source, 'en', function(err, data) {
        if (err) {
          console.log('translating failed', err);
          return sendResponse({err: err});
        }
        console.log('translated');
        var text = data.data.translations[0].translatedText;
        common.saveToStorage('sourceLang', request.source, function() {
          sendResponse({err: null, text: text});
        });
      });
      return true;
  }
});

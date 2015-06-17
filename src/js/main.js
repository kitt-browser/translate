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

  $.get(chrome.extension.getURL('api-proxy-sign'), function(signature) {
    $.ajax({
      url: 'https://web-api-proxy.herokuapp.com/language/translate/v2/detect',
      data: { q: text, key: '{TRANSLATE_KEY}' },
      beforeSend: function(xhr) {
        xhr.setRequestHeader('X-Api-Server-Host', 'https://www.googleapis.com');
        xhr.setRequestHeader('X-Proxy-Authorization', signature);
      },
      success: function(data) {
        var language = data.data.detections && data.data.detections.length &&
          data.data.detections[0].length && data.data.detections[0][0].language;
        console.log('retrieved language', language);
        if (language === 'en' && sourceLang && sourceLang !== 'auto') {
          // translating from English so invert source/target
          targetLang = sourceLang;
          sourceLang = 'en';
        }

        var params = {
          target: targetLang,
          q: text,
          key: '{TRANSLATE_KEY}'
        };

        if (sourceLang && sourceLang !== 'auto') {
          params.source = sourceLang;
        }

        console.log('params to google API', params);

        $.ajax({
          url: 'https://web-api-proxy.herokuapp.com/language/translate/v2',
          data: params,
          beforeSend: function(xhr) {
            xhr.setRequestHeader('X-Api-Server-Host', 'https://www.googleapis.com');
            xhr.setRequestHeader('X-Proxy-Authorization', signature);
          },
          success: function(data) {
            console.log('google api success');
            callback(null, data);
          },
          error: function(err) {
            console.log('error', err);
            callback(err);
          }
        });
      },
      error: function(err) {
        console.log('error', err);
        callback(err);
      }
    });
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

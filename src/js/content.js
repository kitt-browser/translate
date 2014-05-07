"use strict";

var $ = require('../vendor/jquery/jquery');
var template = require('../html/popover.jade');
var _ = require('../vendor/underscore/underscore');

require('../vendor/bootstrap/bootstrap');
require('../vendor/bootstrap/bootstrap.css');
require('../css/content.css');

var $modal;
var originalText;

function hideTranslationPopup() {
  console.log('hiding popup', $modal);
  $modal.modal('hide');
}

function showTranslationPopup(text) {
  hideTranslationPopup();

  console.log('showing popup', $modal, text);

  // We have to delay to make sure popup is hidden.
  _.delay(function() {

    console.log('after delay');

    chrome.runtime.sendMessage(null, {command: 'loadLanguage'}, function(lang) {
      $('#language').val(lang);
    });

    console.log('now showing...');

    $modal.find('#content').text(text);

    $modal.modal('show');

    $('#translate').one('click', function() {
      var source = $('#language option:selected').val();
      chrome.runtime.sendMessage(null, {
        command: 'translate',
        source: source,
        text: originalText
      }, function(res) {
        console.log('received', res);
        if (res.err) {
          console.log('error', res.err);
          hideTranslationPopup();
          return;
        }
        showTranslationPopup(res.text);
      });
    });
  }, 500);
}

$(function() {
  console.log('content script ready!');

  $modal = $(template());
  $('body').append($modal);
  $modal.modal({show: false});

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log('message received');

      if (request.err) {
        originalText = null;
        console.log('error', request.err);
        hideTranslationPopup();
        return true;
      }

      originalText = request.originalText;

      showTranslationPopup(request.text);

      return true;
    });
});

"use strict";

var $ = require('../vendor/jquery/jquery');
var template = require('../html/popover.jade');
var _ = require('../vendor/underscore/underscore');

require('../vendor/bootstrap/bootstrap');
require('../vendor/bootstrap/bootstrap.css');
require('../css/content.css');

require('../vendor/bootstrap-modal/bootstrap-modal-bs3patch.css');
require('../vendor/bootstrap-modal/bootstrap-modal.css');
require('../vendor/bootstrap-modal/bootstrap-modal');
require('../vendor/bootstrap-modal/bootstrap-modalmanager');

var _jQuery = $.noConflict(true);


(function ($) {

  // `bootstrap-modal` BS3 patch.
  $.fn.modal.defaults.spinner = $.fn.modalmanager.defaults.spinner = 
      '<div class="loading-spinner" style="width: 200px; margin-left: -100px;">' +
          '<div class="progress progress-striped active">' +
              '<div class="progress-bar" style="width: 100%;"></div>' +
          '</div>' +
      '</div>';

  // The translate result popup.
  var $modal;
  // The text to be translated (it in case the user wants to re-translate).
  var originalText;

  function hideTranslationPopup() {
    console.log('hiding popup', $modal);
    $modal.modal('hide');
  }


  function translate() {
    hideTranslationPopup();

    // Get the source language (selected by the user).
    var source = $('#language option:selected').val();

    chrome.runtime.sendMessage(null, {
      command: 'translate',
      source: source,
      text: originalText
    }, function(res) {
      if (res.err) {
        console.log('error', res.err);
        hideTranslationPopup();
        // TODO: Show an error.
        return;
      }
      showTranslationPopup(res.text);
    });
  }


  function showTranslationPopup(text) {
    // Delay for a while to make sure popup is hidden.
    _.delay(function() {
      // Get the last used language to bootstrap the popup language select.
      chrome.runtime.sendMessage(null, {command: 'loadLanguage'}, function(lang) {
        $('#language').val(lang);

        // Set the translated popup text & show it.
        $modal.find('#content').text(text);
        $modal.modal('show');
      });
    }, 200);
  }

  $(function() {
    console.log('content script ready!');

    $modal = $(template());
    $('body').append($modal);
    $modal.modal({show: false});
    
    // Retranslate the text on click.
    $('#translate').one('click', translate);

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        console.log('message received:', request.event);

        switch (request.event) {
          case 'translation:loading':
            $('body').modalmanager('loading');
            return;

          case 'translation:finished':
            if (request.err) {
              originalText = null;
              console.log('error', request.err);
              hideTranslationPopup();
            }

            originalText = request.originalText;
            showTranslationPopup(request.text);
        }
      });
  });

})(_jQuery);

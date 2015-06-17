"use strict";

var $ = require('../vendor/jquery/jquery');
var template = require('../html/popover.jade');
var _ = require('../vendor/underscore/underscore');

require('../css/content.css');

require('../vendor/jquery-ui-scalebreaker/jquery-ui-1.10.4.custom.min');
require('../vendor/jquery-ui-scalebreaker/jq-scalebreaker.css');
require('../vendor/jquery-ui-scalebreaker/jq-scalebreaker');

var _jQuery = $.noConflict(true);

(function ($) {

  var slsModal;
  // The text to be translated (in case the user wants to re-translate)
  var originalText;

  function translate() {

    // Get the source language (selected by the user)
    var $lang = slsModal.find('.kitt-translate-select-language option:selected');
    var source = $lang.val();

    chrome.runtime.sendMessage(null, {
      command: 'translate',
      source: source,
      text: originalText
    }, function(res) {
      if (res.err) {
        console.log('error', res.err);
        window.alert('Oops... Failed to translate. Sorry!');
        if (slsModal) $('body').scalebreaker('hide');
        return;
      }
      showTranslation(res.text);
    });
  }

  function showTranslation(text) {
    showPopup();

    chrome.runtime.sendMessage(null, {command: 'loadLanguage'}, function(lang) {

      if (lang) {
        slsModal.find('.kitt-translate-select-language').val(lang);
      }

      // Set the translated popup text & show it
      slsModal.find('.kitt-translate-result').html(text);
      showPopup();
    });
  }

  function showPopup() {
    if (slsModal) return $('body').scalebreaker('refresh');

    $('body').scalebreaker({
      dialogContent: $(template()),
      dialogPosition: 'bottom'
    });

    var innerHeight = window.innerHeight;
    var timer = window.setInterval(function() {
      if (window.innerHeight !== innerHeight) {
        $('body').scalebreaker('refresh');
        innerHeight = window.innerHeight;
      }
    }, 200);

    // Retranslate the text on select change
    $('.kitt-translate-select-language').on('change', translate);

    slsModal = $('body').scalebreaker('getContentElement');

    $('body').scalebreaker('show');

    $('body').on('dialogHidden.jq-scalebreaker', function() {
      console.log('dialog hidden');
      slsModal = null;
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      // Wait for the hide animation to finish.
      window.setTimeout(function() {
        $('body').scalebreaker('destroy');
      }, 200);
    });
  }

  $(function() {

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        console.log('message received:', request.event, request);

        switch (request.event) {
          case 'translation:loading':
            if ( ! slsModal) showPopup();
            return;

          case 'translation:finished':
            if (request.err) {
              originalText = null;
              console.log('error', request.err);
              window.alert('Oops... Failed to translate. Sorry!');
              if (slsModal) $('body').scalebreaker('hide');
              return;
            }

            originalText = request.originalText;
            showTranslation(request.text);
            return;
        }
      });
  });

})(_jQuery);

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
    var source = slsModal.find('.kitt-translate-select-language option:selected').val();
    console.log('SOURCE LANG', source, slsModal.find('.kitt-translate-select-language option:selected').attr('value'));

    chrome.runtime.sendMessage(null, {
      command: 'translate',
      source: source,
      text: originalText
    }, function(res) {
      if (res.err) {
        console.log('error', res.err);
        window.alert('Oops... Failed to translate. Sorry!');
        $('body').scalebreaker('hide');
        // TODO: Show an error.
        return;
      }
      showTranslation(res.text);
    });
  }

  function showTranslation(text) {
    chrome.runtime.sendMessage(null, {command: 'loadLanguage'}, function(lang) {

      if (lang) {
        slsModal.find('.kitt-translate-select-language').val(lang);
      }

      // Set the translated popup text & show it
      slsModal.find('.kitt-translate-result').html(text);
      $('body').scalebreaker('refresh');
    });
  }

  $(function() {

    console.log('content script ready!');

    $('body').scalebreaker({
      dialogContent: $(template()),
      dialogPosition: 'bottom'
    });

    slsModal = $('body').scalebreaker('getContentElement');

    // Retranslate the text on select change
    $('.kitt-translate-select-language').on('change', translate);

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        console.log('message received:', request.event, request);



        switch (request.event) {
          case 'translation:loading':
            if ($('body').scalebreaker('getDialogState') === 'hidden'){
                $('body').scalebreaker('show');
            }
            return;

          case 'translation:finished':
            if (request.err) {
              originalText = null;
              console.log('error', request.err);
              window.alert('Oops... Failed to translate. Sorry!');
              $('body').scalebreaker('hide');
            }

            originalText = request.originalText;
            showTranslation(request.text);
        }
      });
  });

})(_jQuery);

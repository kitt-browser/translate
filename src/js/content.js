"use strict";

var $ = require('../vendor/jquery/jquery');
var template = require('../html/popover.jade');
var _ = require('../vendor/underscore/underscore');

require('../css/content.css');

var _jQuery = $.noConflict(true);


(function ($) {

  var $modal;

  // Prepare HTML wrappers
  var slsModalWrapper =
    '<div id="salsa-ui-modal"></div>';
  var slsBackdropWrapper =
    '<div id="salsa-ui-backdrop"></div>';
  var slsModal, slsBackdrop;

  // The text to be translated (in case the user wants to re-translate)
  var originalText;

  function hideTranslationPopup() {
    // Enable user scrolling the page again, this better not go wrong
    $('body').off('touchmove.kittTranslate');
    animateModalHide();
    slsBackdrop.one('animationend webkitAnimationEnd', function(e){
      $('body').removeClass('salsa-ui-modal-show');
    });
  }

  function translate() {

    // Show loader
    slsModal.removeClass('translation-loaded');

    // Get the source language (selected by the user)
    var source = slsModal.find('.select-language option:selected').val();

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
      showTranslation(res.text);
    });
  }

  function showTranslationPopup() {

    // Disable user scrolling the page while popup is active
    $('body').on('touchmove.kittTranslate', function(e){
      e.preventDefault();
    });

    // Bind backdrop to hide the modal on click
    $(slsBackdrop).one('click.kittTranslate', function(e){
      hideTranslationPopup();
    });

    // Show the modal and backdrop
    $('body').addClass('salsa-ui-modal-show');

    // Rescale modal
    rescaleElement(slsModal);

    // Animate the modal entrance
    animateModalShow();

  }

  function showTranslation(text) {
    chrome.runtime.sendMessage(null, {command: 'loadLanguage'}, function(lang) {

      console.log("val: " + lang);

      slsModal.find('.select-language').val(lang);

      // Set the translated popup text & show it
      slsModal.find('.translate-result').text(text);

      slsModal.addClass('translation-loaded');

    });
  }

  function animateModalShow() {
    slsModal.removeClass('animate-out').addClass('animate-in');
    slsBackdrop.removeClass('animate-out').addClass('animate-in');
  }

  function animateModalHide() {
    slsModal.removeClass('animate-in').addClass('animate-out');
    slsBackdrop.removeClass('animate-in').addClass('animate-out');
  }

  function rescaleElement(el) {
    // Scaling the modal dialog irrespective of the page zoom level
    var body = document.body,
        html = document.documentElement;

    var fullPageHeight = Math.max(body.offsetHeight, 
    html.clientHeight, html.scrollHeight, html.offsetHeight);

    // This is specific to our case of alignment, more relevant properties in CSS
    el.css({
      'left': window.pageXOffset,
      'bottom': fullPageHeight - (window.pageYOffset + window.innerHeight),
      '-webkit-transform': 'scale(' + window.innerWidth/document.documentElement.clientWidth + ')',
    });
  }

  $(function() {

    console.log('content script ready!');

    // Insert our HTML wrappers at the end of the page DOM
    $('body').append(slsBackdropWrapper)
             .append(slsModalWrapper);

    // Cache the created DOM references
    slsModal = $('#salsa-ui-modal');
    slsBackdrop = $('#salsa-ui-backdrop');

    // Add modal content template
    $(slsModal).append($(template()));
    
    // Retranslate the text on select change
    $('.select-language').on('change', translate);


    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        console.log('message received:', request.event);

        // Show loader
        slsModal.removeClass('translation-loaded');

        switch (request.event) {
          case 'translation:loading':
            showTranslationPopup();
            return;

          case 'translation:finished':
            if (request.err) {
              originalText = null;
              console.log('error', request.err);
              hideTranslationPopup();
            }

            originalText = request.originalText;
            showTranslation(request.text);
        }
      });
  });

})(_jQuery);
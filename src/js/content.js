"use strict";

var $ = require('../vendor/jquery/jquery.js');
var templates = require('../html/popover.html');
require('../vendor/bootstrap/bootstrap');
require('../vendor/bootstrap/bootstrap.css');
require('../css/content.css');

$(function() {
  console.log('content script ready!');
   
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log('received', request, $modal);

      var $modal = $(templates.templateTranslate());//$('translate-modal');
      $modal.find('.modal-content').text(request.text);
      $('#myModal').remove();
      $('body').append($modal);

      $('#myModal').modal();
      $('#myModal').modal('show');
      
      sendResponse();
    });
});

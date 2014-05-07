"use strict";

var getFromStorage = function(key, callback) {
  chrome.storage.local.get(key, function(items) {
    callback(items[key]);
  });
};


var saveToStorage = function(key, val, callback) {
  var obj = {};
  obj[key] = val;
  chrome.storage.local.set(obj, callback || function() {});
};


module.exports = {
  getFromStorage: getFromStorage,
  saveToStorage: saveToStorage,
};

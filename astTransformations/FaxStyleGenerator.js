/**
 * FaxProcessor module for generating css files from javascript files who's
 * exports have a styleExports field.
 */
var sys = require('sys'),
		vm = require('vm'),
		F = require('../../lib/Fax');

var _standardTags = {
	div: true, span: true, tr: true, td: true, table: true, h1: true, h2: true,
	h3: true, h4: true, a: true, ul: true, li: true, html: true, body: true
};

module.exports = {
  generateCss: function (fileName) {
	  var exported = require(fileName);
	  var styleObj = exported.styleExports;
    var accum = '', selector;

    if (!styleObj) {
      return null;
    }
    for (selector in styleObj) {
      if (!styleObj.hasOwnProperty(selector)) {
        continue;
      }
      var valueForSelector = styleObj[selector];
      if (!_standardTags[selector] &&
          // No special selectors, default standard object keys to class names
          // because those are the most common selectors.
          selector.indexOf('~') === -1 &&
          selector.indexOf('[') === -1 &&
          selector.indexOf('#') === -1 &&
          selector.indexOf(':') === -1 &&
          selector.indexOf('.') === -1 &&
          selector.indexOf(' ') === -1) {
        selector = '.' + selector;
      }
      if (typeof valueForSelector === 'string') {
        accum += selector + ' ' + valueForSelector;
      } else {
        accum += selector + ' {' + F.serializeInlineStyle(valueForSelector) + '} ';
      }
    }
    return accum;
  }
};

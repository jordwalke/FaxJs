/**
 * FaxProcessor module for generating css files from javascript files who's
 * exports have a styleExports field.
 */
var sys = require('sys'),
		vm = require('vm'),
		F = require('Fax');

/** Forward declaration. */
var _generateCss;

module.exports = {
	render: function (input, fileName, callback) {
    var ee;
		if (callback) {
			try {
				callback(null, _generateCss(input, fileName));
			} catch (e) {
				callback(e, null);
			}
			return;
		} else {
			ee = new(require('events').EventEmitter);
			process.nextTick(function () {
				try {
					var output = _generateCss(input, fileName);
					ee.emit('success', output);
				} catch (e) {
					ee.emit('error', e);
				}
			});
			return ee;
		}
  }
};

var _getResultOfExecuting = function (content, fileName) {
	var result = require(fileName);
	return result.styleExports;
};


var _standardTags = {
	div: true, span: true, tr: true, td: true, table: true, h1: true, h2: true,
	h3: true, h4: true, a: true, ul: true, li: true, html: true, body: true
};

var _convertObjectToCss = function (styleObj) {
	var accum = '', selector;
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
};

var _generateCss = function(content, fileName) {
	return _convertObjectToCss(_getResultOfExecuting(content, fileName));
};

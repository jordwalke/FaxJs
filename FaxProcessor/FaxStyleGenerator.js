/**
 * FaxProcessor module for generating css files from javascript files who's
 * exports have a styleExports field.
 */
var sys = require('sys'),
    burrito = require('burrito'),
		vm = require('vm'),
		F = require('Fax');

module.exports = {
	render: function (input, fileName, callback) {
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
	var sys = require('sys');
  sys.puts('result of executing:');
  sys.puts(result);
	return result.styleExports;
};


var _standardTags = {
	div: true, span: true, tr: true, td: true, table: true, h1: true, h2: true,
	h3: true, h4: true, a: true, ul: true, li: true, html: true, body: true
};

var _convertObjectToCss = function (styleObj) {
  sys.puts('serializing:' + styleObj);
	var accum = '';
	for (var selector in styleObj) {
		if (!styleObj.hasOwnProperty(selector)) {
			continue;
		}
    require('sys').puts('serializing for key: "' + selector + '"');
		var valueForSelector = styleObj[selector];
		require('sys').puts(JSON.stringify(valueForSelector));
		if (!_standardTags[selector] &&
        // No special selectors, default standard object keys to class names
        // because those are the most common selectors.
				selector.indexOf('~') == -1 &&
				selector.indexOf('[') == -1 &&
				selector.indexOf('#') == -1 &&
				selector.indexOf('.') == -1 &&
				selector.indexOf(' ') == -1) {
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

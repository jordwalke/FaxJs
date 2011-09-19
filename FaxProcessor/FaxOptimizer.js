/**
 * Connect module for optimizing fax javascript files.  Can be used as a
 * compiler with callback, or as a blocking reparser.
 */
var sys = require('sys'),
    burrito = require('burrito');

var _optimizeJs = function(src, fileName) {
	src = burrito( src, function (node) {
		if (node.name === 'call') {
		 var hasNoArgs = node.value[1].length === 0;
		 var isDot = node.value[0].length && node.value[0][0] === 'dot';

		 var isObjectInvocation =
				 node.value[0].length > 1 &&
				 node.value[0][1].length > 0 &&
				 node.value[0][1][0] === 'object';
		 var hasConstructor =
				 node.value[0].length > 2;

    /* In the future, we can actually pull in the required modules at 'compile'
     * time and see what ui components they export. Then we don't need to make
     * any guesses about what should be apended. We'll get as close to having no
     * functional difference between pre-optimized and post-optimized code.
     * Also, we can be flexible about multiple arguments, case sensitity, etc as
     * soon as we can detect which ui elements are exported by using'd modules.
     * Right now we are rediculous and look for tail construction with functions
     * that start with capital letters.  */
		if (hasNoArgs && isDot &&  hasConstructor) {
			 var object = node.value[0][1];
			 var constructor = node.value[0][2];
			 var constructorLooksConstructory = constructor[0].toUpperCase() ===
					constructor[0] && constructor[0] !== '_';
			 if (!constructor || !constructorLooksConstructory) {
				 return;
			 }
			 var subObject = burrito(object, arguments.callee);
			 node.wrap('(__NAMESPACE.' + constructor + ').call(' + subObject + ')');
		 }
		}
	});
	src = burrito( src, function (node) {
		if (node.name === 'call') {
			if (node.value.length && node.value[0].length > 2 && node.value[0][2] === 'using') {
        // #iseewhatyoudidthere
				node.wrap("var __NAMESPACE={}; Fax.populateNamespace=__NAMESPACE; (%s)");
			}
		 }
	});
	return src;
};

module.exports = function (input, fileName, callback) {
  var output;
  if (callback) {
    try {
      output = _optimizeJs(input, fileName);
      callback(null, output);
      return output;
    } catch (e) {
      callback(e, null);
      return e;
    }
  } else {
    output = _optimizeJs(input, fileName);
    ee = new(require('events').EventEmitter);
    process.nextTick(function () {
        try {
          sys.puts('emmiting sucess');
          ee.emit('success', output);
        } catch (e) {
          ee.emit('error', e);
        }
    });
    return output;
  }
};


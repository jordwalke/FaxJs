/**
 * Connect module for optimizing fax javascript files.  Can be used as a
 * compiler with callback, or as a blocking reparser.
 */
var sys = require('sys'),
    path = require('path'),
    jsParser = require('uglify-js').parser,
    uglify = require('uglify-js').uglify,
    FaxTailConstructionOptimizer = require('./FaxTailConstructionOptimizer');
    /* Coming soon :) FaxReducer = require('./FaxReducer'); */



var uglyOptimizeJs = function(src, fileName, squeeze, mangle) {
  var baseName = path.basename(fileName, '.js');
  /**
   * Reduce constructions into optimized rendering functions. Then transform
   * tail constructions into optimal tail constructions.
   */

  var reducedRoot, optimizedRoot;
  try {
    /*
     * reducedRoot = FaxReducer.reduceAndCacheModule(baseName, src);
     * if (!reducedRoot) {
     * console.error("ERROR: Reduced root returned as empty:" + fileName);
     * }
     * optimizedRoot =
     *    FaxTailConstructionOptimizer.optimizeTailConstructions(reducedRoot);
     */
    optimizedRoot =
       FaxTailConstructionOptimizer.optimizeTailConstructions(jsParser.parse(src));
  } catch (e) {
    console.error("ERROR: CAUGHT EXCEPTION OPTIMIZING:" + fileName);
    optimizedRoot = jsParser.parse(src);
  }

  if (squeeze) {
    optimizedRoot = uglify.ast_squeeze(optimizedRoot);
  }
  if (mangle) {
    optimizedRoot = uglify.ast_mangle(optimizedRoot);
  }
  var gened = uglify.gen_code(optimizedRoot);
  if(gened !== src) {
    require('sys').puts("Found optimizations in file:" + fileName);
  } else {
    require('sys').puts("Did not find optimizations in:" + fileName);
  }
  return gened;
};

module.exports = function (input, fileName, callback) {
  var output;
  if (callback) {
    require('sys').puts("COMPILING WITH CALLBACK");
    try {
      output = uglyOptimizeJs(input, fileName);
      callback(null, output);
      return output;
    } catch (e) {
      callback(e, null);
      return e;
    }
  } else {
    /* In the current state of the world - this is what is called - no callback
     * is passed - because the entire compile() function above isn't even used.
     */
    output = uglyOptimizeJs(input, fileName);
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

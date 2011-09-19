
/*!
 * Connect - FaxProcessor - style and source transformations Loosely(?) Based on
 * connect compiler. This was just hacked together until it started working.
 */

/**
 * Module dependencies.
 */
var fs = require('fs'),
    path = require('path'),
    parse = require('url').parse;

/**
 * Require cache.
 */

var cache = {};

/**
 * Setup compiler.
 * Options:
 *   - `src`     Source directory, defaults to **CWD**.
 *   - `dest`    Destination directory, defaults `src`.
 *   - `enable`  Array of enabled compilers.
 * Compilers:
 *   - `faxOptimizer`        Compiles fax ui js to faster js
 *   - `faxStyleGenerator`   Compiles fax ui js to faster js
 * @param {Object} options
 * @api public
 */

exports = module.exports = function compiler(options){
  options = options || {};

  var srcDir = options.src || process.cwd(),
      destDir = options.dest || srcDir,
      enable = options.enable;

  if (!enable || enable.length === 0) {
    throw new Error('compiler\'s "enable" option is not set, nothing will be compiled.');
  }

  return function compiler(req, res, next){
    if ('GET' != req.method) return next();
    var pathname = parse(req.url).pathname;
    for (var i = 0, len = enable.length; i < len; ++i) {
      var name = enable[i]
        , compiler = compilers[name];
      if (compiler.match.test(pathname)) {
        require('sys').puts('compiling with compiler' + name);
        var src = (srcDir + pathname).replace(compiler.match, compiler.ext)
          , dest = destDir + pathname;
        require('sys').puts('compiling filename:' + pathname);

        // Compare mtimes
        fs.stat(src, function(err, srcStats){
          if (err) {
            if ('ENOENT' == err.code) {
              next();
            } else {
              next(err);
            }
           } else {
            fs.stat(dest, function(err, destStats){
              if (err) {
                // Oh snap! it does not exist, compile it
                if ('ENOENT' == err.code) {
                  compile();
                } else {
                  next(err);
                }
              } else {
                // Source has changed, compile it
                if (srcStats.mtime > destStats.mtime || true) {
                  compile();
                } else {
                  require('sys').puts('dering to file saving' + pathname);
                  // Defer file serving
                  next();
                }
              }
            });
          }
        });

        // Compile to the destination
        function compile() {
          require('sys').puts('compiling source in COMPILE()');
          fs.readFile(src, 'utf8', function(err, str){
            if (err) {
              next(err);
            } else {
              compiler.compile(str, src, function(err, str){
                if (err) {
                  next(err);
                } else {
                  fs.writeFile(dest, str, 'utf8', function(err){
                    next(err);
                  });
                }
              });
            }
          });
        }
        return;
      }
    }
    next();
  };
};

exports.FaxOptimizer = require('./FaxOptimizer');
exports.StyleGenerator = require('./FaxStyleGenerator');

/**
 * Bundled compilers:
 *
 *  - [js] (fax optimizer)
 *  - [css js module.styleExports]
 */
var compilers = exports.compilers = {
  faxOptimizer: {
    match: /\.js$/,
    ext: '.js',
    compile: function(str, fileName, fn) {
      var faxOptimizer =
          cache.faxOptimizer ||
          (cache.faxOptimizer = require('./FaxOptimizer'));
      try {
        faxOptimizer(str, fileName, fn);
      } catch (err) {
        fn(err);
      }
    }
  },
  faxStyleGenerator: {
    match: /\.css$/,
    ext: '.js',
    compile: function(str, fileName, fn) {
      require('sys').puts('trying to style compile');
      var faxStyleGenerator =
          cache.faxStyleGenerator ||
          (cache.faxStyleGenerator = require('./FaxStyleGenerator'));
      try {
        faxStyleGenerator.render(str, fileName, fn);
      } catch (err) {
        fn(err);
      }
    }
  }
};

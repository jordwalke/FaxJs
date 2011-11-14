var connect = require('connect');
var server = connect.createServer();
var sys = require('sys');
var FaxProcessor = require('FaxProcessor');
var FaxOptimizer = FaxProcessor.FaxOptimizer;

/* Simply registering the FaxOptimizer is sufficient. But for some reason -
 * after reducing, the following line causes problems on the second time a file
 * is reduced.*/
/*server.use(FaxProcessor({ src: __dirname, enable: ['faxOptimizer', 'faxStyleGenerator'] }));*/
server.use(connect.static(__dirname));

sys.puts('mounting at: ' + __dirname);
var browserify = require('browserify')({
    mount : '/browserify.js',
    watch: true
});

// Prepend prototypes (Mozilla - MIT) We should do agent detection and append these only when needed.
browserify.prepend("if (!Array.prototype.filter) { Array.prototype.filter = function(fun /*, thisp*/) { var len = this.length >>> 0; if (typeof fun != 'function') { throw new TypeError(); } var res = []; var thisp = arguments[1]; for (var i = 0; i < len; i++) { if (i in this) { var val = this[i]; if (fun.call(thisp, val, i, this)) { res.push(val); } } } return res; }; }");
browserify.prepend( "if (!Function.prototype.bind) { Function.prototype.bind = function (oThis) { if (typeof this !== 'function') throw new TypeError('Function.prototype.bind - what is trying to be fBound is not callable'); var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () {}, fBound = function () { return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)));    }; fNOP.prototype = this.prototype; fBound.prototype = new fNOP(); return fBound; }; }");
browserify.register(FaxOptimizer);
browserify.require(['Fax', 'FaxUi', 'DemoApp']);
server.use(browserify);


server.listen(8080);
console.log("Static file server running at\n  => http://localhost:" + 8080 + "/\nCTRL + C to shutdown");

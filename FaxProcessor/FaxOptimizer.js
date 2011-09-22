/**
 * Connect module for optimizing fax javascript files.  Can be used as a
 * compiler with callback, or as a blocking reparser.
 */
var sys = require('sys'),
    jsParser = require('uglify-js').parser,
    uglify = require('uglify-js').uglify;
/**
 * Close enough for us!
 */
var isNonTerm = function(obj) {
  return obj && obj.push && obj.indexOf;
};

var isCallNode = function(node) {
  return isNonTerm(node) && node.length && node[0] === 'call';
};


var isValidTailCallConstructor = function(name) {
  return name && name.length &&
         name.charAt(0).toUpperCase() === name.charAt(0) &&
				 name[0] !== '_';
};


      //['call',   ['dot',        ['object', []],                                                 'DemoAppContent'],[]]]]]]
/*                /node[1][0]\   /-----------------------node[1][1]-------------------\
      /node[0]\  /-------------------------------------- node[1] ----------------------------------------------\     /-------------------------- node[2] -----------------------\
OLD: ['call',     [ 'dot'  ,   ['object',[['y',['string','something']],['z',['num',12]]]],           'Paneling'],   [                                                          ]]
NEW: ['call',     [ 'dot'  ,   ['name','__NAMESPACE'                                    ],           'Paneling'],   [['object',[['y',['string','something']],['z',['num',12]]]]]]    */
var swapAndOptimizeTailConstruction = function(origNode, methodData) {
  origNode[1] = [ 'dot',     ['name','__NAMESPACE'                                    ], methodData.methodName];
                                                                                                      origNode[2] = [optimizeTree(methodData.leftOfDot)];
  return origNode;
};
function methodDataIffMethodNode(node) {
  if(!isNonTerm(node)) {
    return null;
  }
  var isCall = node.length === 3 && node[0] === 'call';
  var isDotCall = isCall && isNonTerm(node[1]) && node[1].length && node[1][0] === 'dot';
  var hasDotData = isDotCall && node[1].length === 3 ;
  // We'll be super liberal about what's to the left of the dot:
  // Could have also said: // && isNonTerm(node[1][1]) && node[1][1].length === 2;

  return hasDotData ? {
    typeOfThingLeftOfDot: node[1][1][0],  // We don't currently care about this but helpful in future
    leftOfDot: node[1][1],
    methodName: node[1][2],
    args: node[2]
  } : null;
}

var methodDataIffTailConstruction = function(node) {
  var methodData = methodDataIffMethodNode(node);
  return !!methodData &&
         (!methodData.args || !methodData.args.length) && // no args or empty array
         isValidTailCallConstructor(methodData.methodName) ?
         methodData : null;
};

var usingStatementNodeIffUsingStatement = function(node) {
  if(!isNonTerm(node)) {
    return null;
  }
  var isStatement = node.length && node[0] === 'stat';
  var isUsingStatement =
      isStatement && node.length > 1 && isNonTerm(node[1]) &&
      node[1].length > 1 && isNonTerm(node[1][1]) && node[1][1].length >= 3 &&
      node[1][1][0] === 'dot' && node[1][1][2] === 'using';

  return isUsingStatement ? node : null;
};

var optimizeKnownUsingCall = function(node) {
  var ret = [
    'block',
    [['var', [['__NAMESPACE',['object',[]]]]],
      ['stat',['assign',true,['dot',['call',
              ['name','require'],[['string','Fax']]],'populateNamespace'],
              ['name','__NAMESPACE']]],
     node
  ]];
  return ret;

};

/* "USING" transformation:
                                      /n[1][0]\    /-----------node[1][1]-----\
                         /node[0]\   /-------------------------------------------node[1]--------------------------------------------\
OLD: ['toplevel',   [   ['stat',    [  'call'  ,  ['dot',['name','F'],'using'],    [['name','SomeVarRef'],['name','AnotherVarRef']]]   ]   ]]
NEW ['toplevel',[['block',
      [['var',[['__NAMESPACE',['object',[]]]]],
       ['stat',['assign',true,['dot',['call',['name','require'],[['string','Fax']]],'populateNamespace'],['name','__NAMESPACE']]],
       ['stat',['call',['dot',['name','F'],'using'],[['name','SomeVarRef'],['name','AnotherVarRef']]]]  <--- THIS IS "NODE"
]]]] */

function optimizeTree (root) {
  var i;
  if(!isNonTerm(root)) { // terminal
    return root;
  } else if (isCallNode(root) && methodDataIffTailConstruction(root)) {
    root = swapAndOptimizeTailConstruction(root, methodDataIffTailConstruction(root));
  } else if(usingStatementNodeIffUsingStatement(root)) {
    root = optimizeKnownUsingCall(root);
  } else {
    for (i = 0; i < root.length; i = i+1) {
      root[i] = optimizeTree(root[i]);
    }
  }
  return root;
}


var uglyOptimizeJs = function(src, fileName, squeeze, mangle) {
  var optimizedRoot = optimizeTree(jsParser.parse(src));
  if (squeeze) {
    optimizedRoot = uglify.ast_squeeze(optimizedRoot);
  }
  if (mangle) {
    optimizedRoot = uglify.ast_mangle(optimizedRoot);
  }
  var gened = uglify.gen_code(optimizedRoot);
  if(gened !== src) {
    require('sys').puts("Found optimizations in file:" + fileName);
  }
  return gened;
};

module.exports = function (input, fileName, callback) {
  var output;
  if (callback) {
    try {
      output = uglyOptimizeJs(input, fileName);
      callback(null, output);
      return output;
    } catch (e) {
      callback(e, null);
      return e;
    }
  } else {
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


/**
 * Connect module for optimizing fax javascript files.  Can be used as a
 * compiler with callback, or as a blocking reparser.
 */
var sys = require('sys'),
    jsParser = require('uglify-js').parser,
    uglify = require('uglify-js').uglify;

var isArrayish = function(obj) {
  return obj && obj.push && obj.indexOf;
};
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

var MATCH = function(pattern) {
  return {
    store: function(name) {
      return {
        __onlyMatchingStored: pattern,
        storeIntoName: name
      };
    }
  };
};

var ANY = {
  store: function(name) {
    var anyStored = {
      __anyStored: true,
      storeIntoName: name
    };
    return anyStored;
  }
};

/**
 */
var match = function(node, pattern, matchedSoFar) {
  var storeIntoName, pattI;
  matchedSoFar = matchedSoFar || {};
  if(pattern === node) { // literals/undef/nulls - perfect match
    return matchedSoFar;
  } else if (node === undefined || pattern === undefined ||
             node === null || pattern === null) {
    // found a contradication. If the pattern was a literal null/undef then the
    // node should have matched that exactly in the first step - else we should
    // return false here.
    return null;
  } else if(pattern === ANY) {
    return matchedSoFar;
  } else if(pattern.__anyStored) {
    storeIntoName = pattern.storeIntoName;
    matchedSoFar[storeIntoName] = node;
    return matchedSoFar;
  } else if(pattern.hasOwnProperty('__onlyMatchingStored')) {
    storeIntoName = pattern.storeIntoName;
    matchedSoFar = match(node, pattern.__onlyMatchingStored, matchedSoFar);
    if(!matchedSoFar) {
      return matchedSoFar;
    }
    matchedSoFar[storeIntoName] = node;
    return matchedSoFar;
  } else {               // recurse and mutate matchedSoFar.
    if (isArrayish(node) && isArrayish(pattern)) {
      // contradiction - entire pattern doesn't match
      if(pattern.length > node.length) {
        return null;
      }
      for (pattI = 0; pattI < pattern.length; pattI++) {
        matchedSoFar = match(node[pattI], pattern[pattI], matchedSoFar);
        if(!matchedSoFar) {
          return matchedSoFar;
        }
      }
      return matchedSoFar;
    }
    return null;
  }
  throw "If this is ever thrown, then I vow to rewrite everything " +
        "in Ocaml which features comprehensive pattern matching with " +
        "exhaustiveness checks!";
};

/**
 * When this is mature enough - release as a separate NPM utility - it's quite
 * helpful for code processing. Kind of like a poor man's Ocaml pattern matching
 * in javascript.
 */
var matchQuery = function(node, pattern) {
  var pattI, matchResult, bindings;
  if(pattern === node) { // literals/undef/nulls - perfect match, terminal case
    return {matched: true, val: node};
  } else if (node === undefined || pattern === undefined ||
             node === null || pattern === null) {
    // found a contradication. If the pattern was a literal null/undef then the
    // node should have matched that exactly in the first step - else we should
    // return false here.
    return {matched: false};
  } else if(pattern === ANY) {
    // kind of like another terminal case but the terminal value might have depth to it.
    return {matched: true, val: node};
  } else {               // recurse and mutate matchedSoFar.
    if (isArrayish(node) && typeof pattern === 'object') {
      var recursiveMatchNames = Object.keys(pattern);
      // contradiction - out pattern was trying to match many things, and the
      // node didn't even have enough children.
      if(recursiveMatchNames.length > node.length) {
        return {matched: false};
      }
      bindings = {};
      for (pattI = 0; pattI < recursiveMatchNames.length; pattI = pattI + 1) {
        matchResult = matchQuery(node[pattI], pattern[recursiveMatchNames[pattI]]);
        if(!matchResult.matched) {
          return {matched: false};
        } else {
          if(matchResult.bindings) {
            bindings[recursiveMatchNames[pattI]] = matchResult.bindings;
            bindings[recursiveMatchNames[pattI]].__node = node[pattI];
          } else if (matchResult.hasOwnProperty('val')) {
            bindings[recursiveMatchNames[pattI]] = matchResult.val;
          }
        }
      }
      return {matched: true, bindings: bindings};
    }
    return {matched: false};
  }
  throw "If this is ever thrown, then I vow to rewrite everything " +
        "in Ocaml which features comprehensive pattern matching with " +
        "exhaustiveness checks! Not really but I should.";
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
  // The next few lines are known to work:
  var isCall = node.length === 3 && node[0] === 'call';
  var isDotCall = isCall && isNonTerm(node[1]) && node[1].length && node[1][0] === 'dot';
  var hasDotData = isDotCall && node[1].length === 3 ;

  /* This is the newer experimental matcher we run them in parallel but log
   * errors when we see discrepancies. */
  var matched = match(node,
    [ 'call',
      [ 'dot', MATCH([ANY.store('typeOfThingLeftOfDot')]).store('leftOfDot'), ANY.store('methodName') ], ANY.store('args')
    ]
  );

  /**
   * This is yet another experimental ast query engine that we'll run in
   * parallel to see if it is as accurate as manual checking.
   */
  var nodeConstraint = {
      nodeTypeShouldBe: 'call',
      callBase: {
        operationShouldBe: 'dot',
        leftOfDot: {
          typeOfThingLeftOfDot: ANY
        },
        methodName: ANY
      },
      args: ANY
  };
  var astQueryMatch = matchQuery(node, nodeConstraint);

  // We only check discrepancies in one of the directions - we should check both.
  if(matched) {
    if(matched.typeOfThingLeftOfDot !== node[1][1][0]) {
      console.log("ERROR: Found match error left of dot: if you see this, let someone know");
    }
    if(astQueryMatch.bindings.callBase.leftOfDot.typeOfThingLeftOfDot !== matched.typeOfThingLeftOfDot) {
      console.log("ERROR: AST - astQueryMatch.bindings:" + JSON.stringify(astQueryMatch.bindings) + 
        "matched:" + JSON.stringify(matched) + " Either the matcher or the structural " +
        "matchQuery had problems with 'typeOfThingLeftOfDot'");
    }
    if(matched.methodName !== node[1][2]) {
      console.log("ERROR: Found match error in methodName: if you see this, let someone know");
    }
    if(astQueryMatch.bindings.callBase.methodName !== matched.methodName) {
      console.log("ERROR: AST - astQueryMatch.bindings:" + JSON.stringify(astQueryMatch.bindings) + 
        "matched:" + JSON.stringify(matched) + " Either the matcher or the structural " +
        "matchQuery had problems with 'methodName'");
    }

    if(matched.args !== node[2]) {
      console.log("ERROR: Found match error args: if you see this, let someone know");
    }
    if(astQueryMatch.bindings.args !== matched.args) {
      console.log("ERROR: AST - astQueryMatch.bindings:" + JSON.stringify(astQueryMatch.bindings) + 
        "matched:" + JSON.stringify(matched) + " Either the matcher or the structural " +
        "matchQuery had problems with 'args'");
    }
  }
  /* We'll be super liberal about what's to the left of the dot:
   * Could have also said: // && isNonTerm(node[1][1]) && node[1][1].length === 2; */
   return astQueryMatch.matched ? {
     // We don't currently care about this but helpful in future
     typeOfThingLeftOfDot: astQueryMatch.bindings.callBase.leftOfDot.typeOfThingLeftOfDot,
     leftOfDot: astQueryMatch.bindings.callBase.leftOfDot.__node,
     methodName: astQueryMatch.bindings.callBase.methodName,
     args: astQueryMatch.bindings.args
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
  }

  var methodDataIffTailConstructionRes = methodDataIffTailConstruction(root);
  if (methodDataIffTailConstructionRes) {
    root = swapAndOptimizeTailConstruction(root, methodDataIffTailConstructionRes);
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


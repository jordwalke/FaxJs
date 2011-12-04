/**
 * Connect module for optimizing fax javascript files.  Can be used as a
 * compiler with callback, or as a blocking reparser.
 */
var AstQuery = require('./FaxAstQuery');

function isValidTailCallConstructor(name) {
  return name && name.length &&
         name.charAt(0).toUpperCase() === name.charAt(0) &&
				 name[0] !== '_';
}

/**
 * TODO: Want this form of query processor/walker:
 * var processor = {
 *   query : {yadaYada: 'call', somethingElse: blah-blah},
 *   callBack: function(bindings, rootUglifyNode) {
 *      rearange(bindings.yadaYada[0]...);
 *   }
 * };
 */
var optimizeTailConstructions = function (root) {
  var TAIL_CONST_QUERY = {
    nodeTypeShouldBe: 'call',
    callExpression: {
      operationShouldBe: 'dot',
      leftOfDot: {
        typeOfThingLeftOfDot: AstQuery.ANY
      },
      methodName: AstQuery.ANY
    },
    args: AstQuery.ANY //function(node) { return !!node || !node.length;}
  };

  var USING_STATEMENT_QUERY = {
    nodeTypeShouldBe: 'stat',
    statementExpression: {
      nodeTypeShouldBe: 'call',
      callExpression: {
        operationShouldBe: 'dot',
        leftOfDot: {
          typeOfThingLeftOfDot: 'name'
        },
        methodName: 'using'
      }
    }
  };

  /**
   * When we know a node is a tail constructor - optimize it.
   */
  var rearangeTailConstructionOptimally = function(tailConstructorMatch) {
    var uglifyNode = tailConstructorMatch.__node;
    var bindings = tailConstructorMatch.bindings;
    uglifyNode[1] = [ 'dot',     ['name','__NAMESPACE'], bindings.callExpression.methodName];
    uglifyNode[2] = [optimizeTailConstructions(bindings.callExpression.leftOfDot.__node)];
    return uglifyNode;
  };

  /**
   * When we know that a node represents a 'using' construct - optimize it away.
   * Because the Fax framework is smart enough to handle either optimized context
   * or non-optimized context, we only need to precede the using call with a
   * statement that sets up a __NAMESPACE variable and injects it into the Fax system.
   */
  var optimizeKnownUsingCall = function(usingMatch) {
    var node = usingMatch.__node;
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

  var i;
  if(!AstQuery.isAst(root)) { // terminal
    return root;
  }

  var tailConstructorMatch = AstQuery.match(root, TAIL_CONST_QUERY);
  var usingConstructMatch = AstQuery.match(root, USING_STATEMENT_QUERY);
  var bindings = tailConstructorMatch.matched && tailConstructorMatch.bindings;
  var wasTailConstructorOfInterest = tailConstructorMatch.matched && 
         (!bindings.args || !bindings.args.length) && // no args or empty array
         isValidTailCallConstructor(bindings.callExpression.methodName);
  if (wasTailConstructorOfInterest) {
    root = rearangeTailConstructionOptimally(tailConstructorMatch);
  } else if(usingConstructMatch.matched) {
    root = optimizeKnownUsingCall(usingConstructMatch);
  } else {
    for (i = 0; i < root.length; i = i+1) {
      root[i] = optimizeTailConstructions(root[i]);
    }
  }
  return root;
};


module.exports = {
  isValidTailCallConstructor : isValidTailCallConstructor,
  optimizeTailConstructions : optimizeTailConstructions
};


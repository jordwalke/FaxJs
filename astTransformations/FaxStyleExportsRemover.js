/**
 * Connect module for optimizing fax javascript files.  Can be used as a
 * compiler with callback, or as a blocking reparser.
 */
var AstQuery = require('./FaxAstQuery');

/**
 * Covers the case where styleExports are specified as:
 * module.exports.styleExports - does not cover the case where
 * we assign through exports.styleExports = ..
 */
var STYLE_EXPORTS_VIA_MODULE = {
  nodeTypeShouldBe: 'stat',
  statementAssignment: {
    operation: 'assign',
    notSureWhatThisIs: true,
    leftOfAssignmentOperator: {
      operationShouldBe: 'dot',
      leftOfDot: {
        operationShouldBe: 'dot',
        leftOfDot: {
          type: 'name',
          theName: 'module'
        },
        field: 'exports'
      },
      field: 'styleExports'
    },
    rightOfAssignmentOperator: AstQuery.ANY
  }
};

/**
 * Covers the case of assigning styleExports directly through the exports.
 */
var STYLE_EXPORTS_VIA_EXPORTS = {
  nodeTypeShouldBe: 'stat',
  statementAssignment: {
    operation: 'assign',
    notSureWhatThisIs: true,
    leftOfAssignmentOperator: {
      operationShouldBe: 'dot',
      leftOfDot: {
        type: 'name',
        theName: 'exports'
      },
      field: 'styleExports'
    },
    rightOfAssignmentOperator: AstQuery.ANY
  }
};

function removeStyleExports(masterNode) {
  function transformer(node) {
    if (AstQuery.match(node, STYLE_EXPORTS_VIA_MODULE).matched ||
        AstQuery.match(node, STYLE_EXPORTS_VIA_EXPORTS).matched) {
      return ["stat",["assign",true,["dot",["dot",["name","module"],"exports"],"styleExports"],["object",[]]]];
    } else {
      return node;
    }
  }
  return AstQuery.walkTreeTransformPostOrder(masterNode, transformer);
}

module.exports = {
  removeStyleExports : removeStyleExports
};


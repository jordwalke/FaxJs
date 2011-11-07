var sys = require('sys');

module.exports = {
  isAst: function(arg) {
    return arg instanceof Array;
  },
  ANY: { iAmAny:true },
  /* todo */
  NOT: function(subQuery) {
    return {
      isANot: true,
      subQuery: subQuery
    };
  },
  match: function (node, pattern) {
    var pattI, matchResult, bindings, notSubQuery, notMatchRes;
    // literals/undef/nulls - perfect match, terminal case
    if(pattern === node) {
      return {matched: true, val: node};
    } else if(pattern === this.ANY) {
      /* kind of like another terminal case but the terminal value might have depth to it. */
      return {matched: true, val: node};
      //} else if (pattern.isANot) {
      //   notSubQuery = pattern.subQuery;
      //   notMatchRes = this.match(node, notSubQuery);
    } else if (node === undefined || pattern === undefined ||
               node === null || pattern === null) {
      /* found a contradiction. If the pattern was a literal null/undef then the
       * node should have matched that exactly in the first step - else we should
       * return false here. */
      return {matched: false};
    } else {               
      /* recurse and mutate matchedSoFar. */
      if (this.isAst(node) && typeof pattern === 'object') {
        var recursiveMatchNames = Object.keys(pattern);
        /* contradiction - out pattern was trying to match many things, and the
         * node didn't even have enough children. */
        if(recursiveMatchNames.length > node.length) {
          return {matched: false};
        }
        bindings = {};
        for (pattI = 0; pattI < recursiveMatchNames.length; pattI = pattI + 1) {
          matchResult = this.match(node[pattI], pattern[recursiveMatchNames[pattI]]);
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
        // the __node here would only ever be surfaced at the top level of a query
        return {matched: true, bindings: bindings, __node: node};
      }
      return {matched: false};
    }
    throw "Rewrite in a language with ehxuastiveness checks.";
  },

  /**
   * Walks the ast tree, applying your potentiallyMutativeCallback. Since it is
   * only potentially mutative, we require that your callback return the new
   * structure. Do not rely merely on your mutation to take effect without
   * returning the new structure and do not expect your callback not to be
   * mutating actual nodes - it will if you execute mutative code, we don't
   * clone before passing it to you. What you return *will certainly* become the
   * new node.
   */
  walkTreeTransformPostOrder: function(node, potentiallyMutativeCallback) {
    var i, traversalStack = [node], dependencyStack = [], next, newNext;
    /**
     * Allows references to be preserved.
     */
    function mutateToBe (arr, newArr) {
      if(arr === newArr) {
        return arr;
      }
      while(arr.length) {
        arr.pop();
      }
      for(var j=0; j < newArr.length; j++) {
        arr.push(newArr[j]);
      }
    }
    /**
     * By the end of exploring the tree (when traversal stack is empty)
     * the dependency stack should contain all elements such that no
     * two elements at indicies i and j respectively shall exist in
     * the tree such that i > j and dependencyStack[j] is a child of
     * dependencyStack[i] in the original ast tree.
     */
    while (traversalStack.length) {
      next = traversalStack.pop();
      dependencyStack.push(next);
      if (next instanceof Array) {
        for(i=0; i < next.length; i++) {
          traversalStack.push(next[i]);
        }
      }
    }
    while (dependencyStack.length) {
      next = dependencyStack.pop();
      newNext = potentiallyMutativeCallback(next);
      if(next instanceof Array) {
        mutateToBe(next, newNext);
      }
    }
    return node;
  },

  findFirstMatch: function (node, querySpec) {
    var i, childMatchRes;
    var matchResult = this.match(node, querySpec);
    if (matchResult.matched) {
      return matchResult;
    }
    if (node instanceof Array) {
      for (i = 0; i < node.length; i = i+1) {
        childMatchRes = this.findFirstMatch(node[i], querySpec);
        if (childMatchRes && childMatchRes.matched) {
          return childMatchRes;
        }
      }
    }
    return undefined;
  },

  /**
   * Finds all matches that are in 'node', but will not return matches that
   * occur inside of another match. Useful for searching for top level
   * declarations in a file, etc.
   */
  findAllTopLevelMatches: function(node, querySpec) {
    var i, allMatches = [], childMatchResults;
    var matchResult = this.match(node, querySpec);
    if (matchResult.matched) {
      allMatches = [matchResult];
      return allMatches;
    }
    if (node instanceof Array) {
      for (i = 0; i < node.length; i = i+1) {
        childMatchResults = this.findAllTopLevelMatches(node[i], querySpec);
        allMatches = allMatches.concat(childMatchResults);
      }
    }
    return allMatches;
  },

  /**
   * Finds all matches that are in 'node'. No structure is preserved, so this
   * wouldn't likely be used in a situation where you'd want to rearrange the
   * tree, because you usually want to do something in a deterministic
   * post-order traversal - just use this for searching for existence.
   */
  findAllMatches: function(node, querySpec) {
    var i, allMatches = [], childMatchResults;
    var matchResult = this.match(node, querySpec);
    if (matchResult.matched) {
      allMatches.push(matchResult);
    }
    if (node instanceof Array) {
      for (i = 0; i < node.length; i = i+1) {
        childMatchResults = this.findAllMatches(node[i], querySpec);
        allMatches = allMatches.concat(childMatchResults);
      }
    }
    return allMatches;
  }
};











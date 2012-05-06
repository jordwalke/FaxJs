/*
 * FaxJs User Interface toolkit.
 *
 * Copyright (c) 2011 Jordan Walke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 * I am providing code in this repository to you under an open source license.
 * Because this is my personal repository, the license you receive to my code
 * is from me and not from my employer (Facebook).
 *
 */

/* FDomAttributes */
var FDomAttributes = require('./FDomAttributes');


/**
 * @extractChildrenLegacy: In the legacy specification, dom components may
 * accept named attributes that are not in the reserved attribue names (such
 * as onClick/ classSet) and these would be interpreted as named children
 * (instead of using childSet/childList). The new dom children specification
 * accepts a structure that is an array/object tree that is flattened by the
 * rendering/reconciliation engine. This allows users of the old format to be
 * compatible with the newer rendering/reconciliation engine that performs
 * flattening. We don't need to be too concerned about the performance of this
 * as old code should be migrated to the new specification.
 */
var extractChildrenLegacy = function(props) {
  if (props.content) {
    return null;
  }
  var prop, ret = {};
  for (prop in props) {
    if (!props.hasOwnProperty(prop)) {
      continue;
    }
    if (FDomAttributes.allTagAttrsAndHandlerNames[prop]) {
      continue;
    }
    ret[prop] = props[prop];
  }
  return ret;
};
exports.extractChildrenLegacy = extractChildrenLegacy;

/**
 * @traverseChildStructures:  Utility for traversing child structures. Traverses
 * the allowable forms of dom children specification.  Allows engines that
 * generate actual markup or reconcile logical doms in memory the ability to
 * reason about richly structured children in a flattened manner. Creation
 * process *and* reconciliation process may both find this useful.
 * @childStructures - child structures to traverse
 * @cb - invoked for each child discovered, passed the name prefix.
 * @emptyCb - invoked for each falsey child discovered
 *
 * The reason for the distinction between @cb and @emptyCb is that we already
 * needed to distinguish between falsey and non-falsey children to check for
 * genMarkup. We don't need to make the user of this function perform that check
 * again.
 *
 * The pattern of having callbacks that mutate their environment is not
 * desirable but it may be the only efficient way to implement a very general
 * traverser that is performs well for markup generation, and reconcilation
 * (reconciliation being a mutative process.)
 *
 */
var traverseChildStructures = function(childStructures, cb, emptyCb) {
  var indexIntoFlattened = 0;
  /**
   * @traverseImpl: Eliminates the need to continuously pass the cb and emptyCb
   * to each recursive call.
   */
  var traverseImpl = function(structures, prefix) {
    var key, i;
    if (structures instanceof Array) {
      for (i = 0; i < structures.length; i++) {
        traverseImpl(structures[i], prefix + '[' + i + ']');
      }
    } else if (!structures) {
      emptyCb(prefix, indexIntoFlattened);
      indexIntoFlattened++;
    } else if (structures.genMarkup) {
      /* We found a component instance */
      cb(structures, prefix, indexIntoFlattened);
      indexIntoFlattened++;
    } else if (typeof structures === 'object') {
      for (key in structures) {
        if (structures.hasOwnProperty(key)) {
          traverseImpl(structures[key], prefix + '{' + key + '}');
        }
      }
    }
    // Todo: String children become text nodes.
  };
  traverseImpl(childStructures, '');
};

exports.traverseChildStructures = traverseChildStructures;

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


/**
 * FDomMutation: Reconciles the lowest level building blocks applications with
 * new data. Many of the methods should be invoked within the context of the
 * component being reconciled ("this") or used as a mixin.
 */

var Fu = require('./FUtils');
var FDomAttributes = require('./FDomAttributes');
var FBrowserUtils = require('./FBrowserUtils');
var FErrors = require('./FErrors');
var keyOf = Fu.keyOf;

/* Useful resolved keys. */
var CLASS_SET_KEY = keyOf({classSet: null});
var STYLE_KEY = keyOf({style: null});
var POS_INFO_KEY = keyOf({posInfo: null});
var CONTENT_KEY = keyOf({content: null});
var DANGEROUSLY_SET_INNER_HTML_KEY = keyOf({dangerouslySetInnerHtml: null});
var INNER_HTML_KEY = keyOf({innerHtml: null});
var DYNAMIC_HANDLERS_KEY = keyOf({dynamicHandlers: true});

var CHILD_SET_KEY = keyOf({childSet: null});
var CHILD_LIST_KEY = keyOf({childList: null});

/* FDomAttributes */
var _extractAndSealPosInfoImpl = FDomAttributes.extractAndSealPosInfo;
var controlUsingSetAttr = FDomAttributes.controlUsingSetAttr;
var controlSimply = FDomAttributes.controlSimply;
var controlDirectlyNonIdempotent = FDomAttributes.controlDirectlyNonIdempotent;

/* FEvent */
var FEvent = require('./FEvent');

/* FDomUtils */
var FDomUtils = require('./FDomUtils');
var singleDomNodeFromMarkup = FDomUtils.singleDomNodeFromMarkup;
var insertNodeAfterNode = FDomUtils.insertNodeAfterNode;
var serializeInlineStyle = FDomUtils.serializeInlineStyle;
var renderClassSet = FDomUtils.renderClassSet;
var appendMarkup = FDomUtils.appendMarkup;

/**
 * @idPrefixesAwaitingFreeing: When we deallocate a component, we mark the id
 * prefix as being freed. We can then, at our leisure, sweep through all
 * handlers who have a prefix of that same id, and delete the function handler
 * which should be the last remaining object that has a reference to our
 * deallocated dom elements or component instances. The assumption that we can
 * track this by id prefix is due to the guarantee that we have about id
 * namespaces (they mirror the tree structure).  In alternative rendering/event
 * engines, we'll have to manage this in another way.
 */
var idPrefixesAwaitingFreeing = {};
exports.releaseMemoryReferences = function() {
  FEvent.releaseMemoryReferences(idPrefixesAwaitingFreeing);
  idPrefixesAwaitingFreeing = {};
};

/**
 * -@getIdPrefixesAwaitingFreeing_WARNING_DISCARD_IMMEDIATELY: Be careful what
 *  you do with the results of this function. If there are dangling references
 *  to the result of this function (in your application etc) then you may
 *  inadvertently hold on to memory references that prevent GC from doing its
 *  job.
 */
exports.getIdPrefixesAwaitingFreeing_WARNING_DISCARD_IMMEDIATELY = function() {
  return idPrefixesAwaitingFreeing;
};

/**
 * -@setBrowserOptimalPositionComputation: Before the initial render, call this
 *  function to ensure that we compute position information in a way that
 *  performs best. This needs to be a function in both the FDomGeneration module
 *  and the FDomGeneration module for performance reasons.
 */
exports.setBrowserOptimalPositionComputation = function(useTransforms) {
  _extractAndSealPosInfoImpl =
      FDomAttributes.getBrowserPositionComputation(useTransforms);
};


/**
 * -@controlSingleDomNode: Useful when you have a dom node or at least an id of
 *  an element, properties, and want to control the entire node based on those
 *  properties.  This doesn't reconcile event handlers, or children, just the
 *  physical dom node. If the dom node was actually touched, we return the dom
 *  node, otherwise we return null. The main reason for that odd return behavior
 *  is for performance - we lazily cache dom nodes when they're updated, and
 *  only when they're updated. Accepts an optional lastProps, in order to avoid
 *  touching dom nodes if nothing has changed.
 * -This function is probably the single most critical path for performing
 *  updates on the dom. If the implementation is ugly, it's because it has to be
 *  in order to be performant. It's unclear in which cases double checking for
 *  changed values in memory ends up saving performance, but it's likely more
 *  beneficial in cases where elements are not positioned absolutely. It should
 *  be easy to test this theory.
 * -Comment 1: Since we're currently using cssText for posInfo and style, when
 *  one is recomputed the other must be as well - we handle this at the very
 *  end. (Should benchmark setting individual attributes [abs pos vs not])
 */
exports.controlSingleDomNode = function(el, elemId, nextProps, lastProps) {
  var cssText = '', cssTextForStyle = '', cssTextForPosInfo = '',
      propKey, currentPhysicalDomValue, nextPos, lastPos;

  for (propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) { continue; }
    var prop = nextProps[propKey];
    if(propKey === CLASS_SET_KEY) {
      if (JSON.stringify(lastProps.classSet) !==
          JSON.stringify(nextProps.classSet)) {
        el = el || document.getElementById(elemId);
        el.className = renderClassSet(prop);
      }

    } else if(propKey === STYLE_KEY) { // Seee Comment 1
      if (JSON.stringify(prop) !== JSON.stringify(lastProps.style)) {
        cssTextForStyle = serializeInlineStyle(prop);
      }
    } else if(propKey === POS_INFO_KEY) {
      nextPos = prop;
      lastPos = lastProps.posInfo || {};
      if (nextPos && (nextPos.l !== lastPos.l || nextPos.t !== lastPos.t ||
          nextPos.w !== lastPos.w || nextPos.h !== lastPos.h ||
          nextPos.r !== lastPos.r || nextPos.b !== lastPos.b)) {
        cssTextForPosInfo = _extractAndSealPosInfoImpl(prop);
      }
    } else if (prop !== lastProps[propKey]) {
      el = el || document.getElementById(elemId);
      if (controlUsingSetAttr[propKey]) {
        el.setAttribute(propKey, prop);
      } else if (propKey === CONTENT_KEY) {
        el.textContent = prop;
      } else if (controlSimply[propKey]) {
        el[propKey] = prop;
      } else if (controlDirectlyNonIdempotent[propKey]) {
        /* Unclear if we need to still retrieve these values from dom. */
        currentPhysicalDomValue = el[propKey];
        if (currentPhysicalDomValue !== prop) {
          el[propKey] = prop;
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML_KEY) {
        el.innerHTML = prop;
      } else if (propKey === INNER_HTML_KEY) {
        throw FErrors.CANNOT_SET_INNERHTML;
      }
    }
  }

  /* Since we set the style all at once - we need both. This should be the first
   * thing to change and benchmark - don't always set the style string, set
   * individual attributes - and then we won't need to always have both
   * computed. */
  if (cssTextForStyle && !cssTextForPosInfo) {
    cssTextForPosInfo = _extractAndSealPosInfoImpl(nextProps.posInfo);
  }
  if (cssTextForPosInfo && !cssTextForStyle) {
    cssTextForStyle = serializeInlineStyle(nextProps.style);
  }
  if (cssTextForStyle || cssTextForPosInfo) {
    cssText += cssTextForStyle;
    cssText += cssTextForPosInfo;
    el = el || document.getElementById(elemId);
    el.style.cssText = cssText;
  }
  return el;
};

/**
 * @reconcileDomChildrenByKey: Reconciles new, deallocates old, and sets
 * properties on remaining children. Invoke with 'this' or use as a mixin.
 * Expects children in this.children, node id this._rootDomId, the node at
 * this.rootDomNode (or will place it there).
 * -Comment 0: Identical constructor type means we'll control the existing child
 *  by that name, and therefore preserve their instance state.
 * -Comment 1: Otherwise: Ensure no resources for this child, whether or not
 *  there ever were any to begin with. This child may have been null, or not a
 *  real component.  Otherwise, we have the same name but different type.  It
 *  likely even have the same interface. It's not even clear what to do here. I
 *  would opt for eventually saying if the child is named the exact same, then
 *  they need to have the exact same 'type'.  If there's different subtypes etc,
 *  you should put them in a different child key that is conditionally included
 *  in the structure.  This child should not only go away (have resources
 *  deallocated) but also be recreated.  It may have been falsey in the first
 *  place in which case it will be idempotently deleted before recreating.
 * -Comment 2: Ensure no-longer-existing children resources are deallocated.
 * -Comment 4: Allocate new children that were not previously present.
 * -Comment 4: Since we want to keep this child. Delete it from the list of id
 *  prefixes awaiting clearing.) - it could have been pending a clear, but then
 *  re-added as a child before we had the opportunity to clean up memory.
 */
exports.reconcileDomChildrenByKey = function(nextChildren, ignore, only) {
  var myChildren = this.children || (this.children = {}),
      removeChildren = {},
      childKey, newMarkup,
      rootDomId = this._rootDomId, rootDomIdDot = rootDomId + '.',
      removeId, domToRemove, lastIteratedDomNodeId = null;
  var curChild, newChild, newChildId, removeChild;
  FErrors.throwIf(!this._rootDomId, FErrors.CONTROL_WITHOUT_BACKING_DOM);

  for (childKey in myChildren) {
    if (!myChildren.hasOwnProperty(childKey) || only && !only[childKey] ||
        ignore && ignore[childKey]) {
      continue;
    }
    curChild = myChildren[childKey];
    newChild = nextChildren[childKey];
    if(curChild && newChild && newChild.props &&
        newChild.constructor === curChild.constructor) {
      curChild.doControl(newChild.props);  // Comment 0
    } else {
      removeChildren[childKey] = curChild; // Comment 1
    }
  }

  for (childKey in removeChildren) {       // Comment 2
    if (!removeChildren.hasOwnProperty(childKey)) { continue; }
    removeChild = myChildren[childKey];
    if (removeChild && removeChild.doControl) {
      removeId = rootDomIdDot + childKey;
      domToRemove =
        removeChild.rootDomNode || document.getElementById(removeId);
      domToRemove.parentNode.removeChild(domToRemove);
      delete myChildren[childKey];
      idPrefixesAwaitingFreeing[removeId] = true;
    }
  }

  for (childKey in nextChildren) {      // Comment 3
    if (!nextChildren.hasOwnProperty(childKey) ||
        only && !only[childKey] || ignore && ignore[childKey]) {
      continue;
    }
    newChild = nextChildren[childKey];
    newChildId = rootDomIdDot + childKey;
    delete idPrefixesAwaitingFreeing[newChildId]; // See Comment 4
    if (myChildren[childKey]) {
      lastIteratedDomNodeId = newChildId;
    } else if(newChild && newChild.props) {
      newMarkup = newChild.genMarkup(newChildId, true, true);
      myChildren[childKey] = newChild;
      var newDomNode = singleDomNodeFromMarkup(newMarkup);
      insertNodeAfterNode(
            this.rootDomNode ||
            (this.rootDomNode = document.getElementById(rootDomId)),
        newDomNode, document.getElementById(lastIteratedDomNodeId));
      lastIteratedDomNodeId = newChildId;
    }
  }
};

/**
 * @reconcileDomChildrenByArray:
 * (Comment 1): As with the key/val version - is not intended for use with
 * tables (yet).
 * (Comment 2): There's a subtle issue when the list shrinks, then grows again
 * before we have a chance to clear out memory with this id prefix space. There
 * may be handlers from the first instance that only apply to it - not the
 * replacement. If the array is entirely homogeneous, if won't matter because
 * the new entry will replace all of the handlers, but if they differ in the set
 * of handlers attached - there could be issues. The solution would be to clear
 * out all handlers every time the array shrinks. This issue doesn't exist with
 * the key/val based api, because an items identity is entirely determined by
 * it's key. So when we see the array shrink - we perform our own memory clean
 * up here, instead of using the general cleanup 'idPrefixesAwaitingFreeing'.
 */
exports.reconcileDomChildrenByArray = function(nextChildren) {
  var myChildren = this.children || (this.children = []),
      child, newChild, newMarkup,
      jj, ii, kk, domToRemove, removeId,
      rootDomIdDot = this._rootDomId + '.', newChildId,
      idPrefixesToFreeNow = {},
      numToRemain = Math.min(myChildren.length, nextChildren.length);

  for (jj = 0; jj < numToRemain; jj++) {
    child = myChildren[jj];
    child.doControl(nextChildren[jj].props);
  }

  /*
   * Delete all resources for children that are observed to be missing. Manage
   * our own memory freeing due to the issue raised in (Comment 1);
   */
  for (ii = nextChildren.length; ii < myChildren.length; ii++) {
    removeId = rootDomIdDot + ii;
    idPrefixesToFreeNow[removeId] = true;
    domToRemove = document.getElementById(rootDomIdDot + ii);
    FErrors.throwIf(!domToRemove, FErrors.NO_DOM_TO_HIDE);
    domToRemove.parentNode.removeChild(domToRemove);
  }
  FEvent.releaseMemoryReferences(idPrefixesToFreeNow);

  for (kk = numToRemain; kk < nextChildren.length; kk++) {
    newChild = nextChildren[kk];
    newChildId = rootDomIdDot + kk;
    newMarkup = newChild.genMarkup(newChildId, true, true);
    delete idPrefixesAwaitingFreeing[newChildId];
    myChildren[kk] = newChild;
    appendMarkup(document.getElementById(this._rootDomId), newMarkup);
  }
  myChildren.length = nextChildren.length;
};


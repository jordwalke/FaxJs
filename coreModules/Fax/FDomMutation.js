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
 * Expects children in this.domChildren, node id this._rootDomId, the node at
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
 * -Comment 5: We should clear out memory waiting to be freed here. Otherwise, a
 *  child could have switched constructor types and still have event handlers
 *  registered on it's rootmost dom node that were left over from the old type.
 * -Comment 6: Since all memory freeing happens the moment we remove an element
 *  or a set of elements, it's worth thinking about ways to defer the search of
 *  dead handlers until a later moment. A prior implementation of these
 *  reconcilers would deffer all cleanup until a later time, but that creates
 *  subtle bugs when swapping out old child instances with new instances of a
 *  different type - to avoid bugs, cleanup needs to happen before the new child
 *  is attached. A solution to explore, is encoding the component constructor
 *  type in the top level handler id <component_type>some.id.space@onclick.
 */
exports.reconcileDomChildrenByKey = function(nextChildrenParam, ignore, only) {
  var myChildren = this.domChildSet || (this.domChildSet = {}),
      nextChildren = nextChildrenParam || {},
      removeChildren = {},
      idPrefixesToFreeNow = {},
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
      idPrefixesToFreeNow[removeId] = true;
    }
  }

  /* See (Comment 5) */
  FEvent.releaseMemoryReferences(idPrefixesToFreeNow);

  for (childKey in nextChildren) {      // Comment 3
    if (!nextChildren.hasOwnProperty(childKey) ||
        only && !only[childKey] || ignore && ignore[childKey]) {
      continue;
    }
    newChild = nextChildren[childKey];
    newChildId = rootDomIdDot + childKey;
    if (myChildren[childKey]) {
      lastIteratedDomNodeId = newChildId;
    } else if(newChild && newChild.props) {
      FErrors.throwIf(newChild._rootDomId, FErrors.USING_CHILD_TWICE);
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
 * -(Comment 1): As with the key/val version - is not intended for use with
 *  tables (yet).
 */
exports.reconcileDomChildrenByArray = function(nextChildrenParam) {
  var myChildren = this.domChildList || (this.domChildList = []),
      nextChildren = nextChildrenParam || [],
      curChild, newChild, newMarkup,
      jj, ii, kk, domToRemove, domToInsert, removeId,
      rootDomId = this._rootDomId,
      rootDomIdDot = this._rootDomId + '.', newChildId,
      idPrefixesToFreeNow = {},
      numToRemain = Math.min(myChildren.length, nextChildren.length);

  function remove(ii) {
    removeId = rootDomIdDot + ii;
    idPrefixesToFreeNow[removeId] = true;
    domToRemove = document.getElementById(rootDomIdDot + ii);
    FErrors.throwIf(!domToRemove, FErrors.NO_DOM_TO_HIDE);
    domToRemove.parentNode.removeChild(domToRemove);
  }

  function append(kk) {
    newChildId = rootDomIdDot + kk;
    newChild = nextChildren[kk];
    FErrors.throwIf(newChild._rootDomId, FErrors.USING_CHILD_TWICE);
    newMarkup = newChild.genMarkup(newChildId, true, true);
    myChildren[kk] = newChild;
    appendMarkup(document.getElementById(rootDomId), newMarkup);
  }

  /*
   * Immediately releases memory for old instance, then allocates new instance,
   * swapping dom resources. Cannot call out to remove() - must be done in a
   * particular way, by clearing out memory before clobbering with the
   * replacement to avoid dangling handlers.
   */
  function clobber(jj, theNewChild) {
    newChildId = removeId = rootDomIdDot + jj;

    /* Clear out any old handlers */
    idPrefixesToFreeNow[removeId] = true;
    FEvent.releaseMemoryReferences(idPrefixesToFreeNow);
    idPrefixesToFreeNow = {};

    domToRemove = document.getElementById(removeId);
    FErrors.throwIf(!domToRemove, FErrors.NO_DOM_TO_HIDE);
    FErrors.throwIf(theNewChild._rootDomId, FErrors.USING_CHILD_TWICE);
    newMarkup = theNewChild.genMarkup(newChildId, true, true);
    myChildren[jj] = theNewChild;
    domToInsert = singleDomNodeFromMarkup(newMarkup);
    domToRemove.parentNode.replaceChild(domToInsert, domToRemove);
  }

  /*
   * Go through prior indices, controlling or swapping out elements.
   */
  for (jj = 0; jj < numToRemain; jj++) {
    newChild = nextChildren[jj];
    curChild = myChildren[jj];
    if (curChild && newChild && newChild.constructor === curChild.constructor) {
      curChild.doControl(newChild.props);
    } else {
      FErrors.throwIf(!newChild, FErrors.MISSING_ARRAY_CHILD);
      clobber(jj, newChild);
    }
  }

  for (ii = nextChildren.length; ii < myChildren.length; ii++) {
    remove(ii);
  }
  FEvent.releaseMemoryReferences(idPrefixesToFreeNow);

  for (kk = numToRemain; kk < nextChildren.length; kk++) {
    append(kk);
  }
  myChildren.length = nextChildren.length;
};


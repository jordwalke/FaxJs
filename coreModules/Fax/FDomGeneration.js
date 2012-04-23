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
 * FDomGeneration: Materializes the lowest level building blocks of
 * applications. Current implementation uses string concatenation - alternative
 * engines may be substituted. Many of the methods should be invoked within the
 * context of the component being reconciled ("this").
 */
var FUtils = require('./FUtils');
var FDomAttributes = require('./FDomAttributes');
var FBrowserUtils = require('./FBrowserUtils');
var FErrors = require('./FErrors');
var keyOf = FUtils.keyOf;


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
var renderSimply = FDomAttributes.renderSimply;

/* FBrowserUtils */
var escapeTextForBrowser = FBrowserUtils.escapeTextForBrowser;

/* FEvent */
var FEvent = require('./FEvent');
var registerHandlers = FEvent.registerHandlers;
var registerHandlerByName = FEvent.registerHandlerByName;
var abstractHandlers = FEvent.abstractHandlers;

/* FDomUtils */
var FDomUtils = require('./FDomUtils');
var renderClassSet = FDomUtils.renderClassSet;
var tagAttrMarkupFragment = FDomUtils.tagAttrMarkupFragment;
var serializeInlineStyle = FDomUtils.serializeInlineStyle;


/**
 * @setBrowserOptimalPositionComputation: Before the initial render, call this
 * function to ensure that we compute position information in a way that
 * performs best. This needs to be a function in both the FDomGeneration module
 * and the FDomGeneration module for performance reasons.
 */
var setBrowserOptimalPositionComputation =
exports.setBrowserOptimalPositionComputation = function(useTransforms) {
  _extractAndSealPosInfoImpl =
      FDomAttributes.getBrowserPositionComputation(useTransforms);
};

/**
 * -@generateDomChildrenByKey: Computes markup for/allocates child structures.
 *  Invoke with the proper context of 'this', or add to your class as a mixin.
 * -Allocates this.domChildren= {} - where it stores new children.  Note that
 *  this function and generateDomChildrenByArray are very similar, but this one
 *  takes a set of key value specified children. Any attempt to abstract the two
 *  into a common function would likely hurt performance.
 * -See (Comment 1) in @_genMarkup in FStructuredComponent.
 */
var generateDomChildrenByKey = exports.generateDomChildrenByKey =
function(idRoot, childStructures, doMarkup, doHandlers) {
  var childIdRoot, childKey, child, accum = '',
      myChildren = this.domChildSet = {};

  if (doMarkup) {
    for (childKey in childStructures) {
      if (!childStructures.hasOwnProperty(childKey)) { continue; }
      child = childStructures[childKey];
      childIdRoot = idRoot;
      childIdRoot += '.';
      childIdRoot += childKey;
      if (child) {
        FErrors.throwIf(child._rootDomId, FErrors.USING_CHILD_TWICE);
        myChildren[childKey] = child;
        accum += child.genMarkup(childIdRoot, doMarkup, doHandlers);
      }
    }
    return accum;
  } else {
    for (childKey in childStructures) {
      if (!childStructures.hasOwnProperty(childKey)) { continue; }
      child = childStructures[childKey];
      childIdRoot = idRoot;
      childIdRoot += '.';
      childIdRoot += childKey;
      if (child) {
        FErrors.throwIf(child._rootDomId, FErrors.USING_CHILD_TWICE);
        myChildren[childKey] = child;
        child.genMarkup(childIdRoot, doMarkup, doHandlers);
      } else if(!child && typeof child !== 'undefined') {
        myChildren[childKey] = null;
      }
    }
  }
};

/**
 * @generateDomChildrenByArray: Allocates and computes markup for child
 * structures via an array of specified children. Allocates this.domChildList =
 * [] where it stores new child instances.
 */
var generateDomChildrenByArray = exports.generateDomChildrenByArray =
function(idRoot, newChildrenParam, doMarkup, doHandlers) {
  var childIdRoot, i, child, accum = '',
      myChildren = this.domChildList = [],
      newChildren = newChildrenParam || [];

  if (doMarkup) {
    for (i=0; i < newChildren.length; i=i+1) {
      child = newChildren[i];
      childIdRoot = idRoot;
      childIdRoot += '.';
      childIdRoot += i;
      if (child) {
        FErrors.throwIf(child._rootDomId, FErrors.USING_CHILD_TWICE);
        myChildren[i] = child;
        accum += child.genMarkup(childIdRoot, doMarkup, doHandlers);
      }
    }
    return accum;
  } else {
    for (i=0; i < newChildren.length; i=i+1) {
      child = newChildren[i];
      childIdRoot = idRoot;
      childIdRoot += '.';
      childIdRoot += i;
      if (child) {
        FErrors.throwIf(child._rootDomId, FErrors.USING_CHILD_TWICE);
        myChildren[i] = child;
        child.genMarkup(childIdRoot, doMarkup, doHandlers);
      }
    }
  }
};

/**
 * @generateDomNodeAndChildren:
 * -Dispatches to proper child allocation function (detects array children vs.
 *  key based children vs. embedded children.)
 * -Generates properties of a physical dom node for the open tag - this is
 *  analogous to reconcilePhysicalDomNode : <div {...here...>} </div>
 * -Performance explanation: If no one has augmented Object.prototype, iterating
 *  through object properties is faster, even if you know the range of values
 *  that might be found. See http://jsperf.com/obj-vs-arr-iteration . The checks
 *  for each member of the props are in order of likeliness to occur:
 * -Call with context 'this' equaling the instance of dom component that you
 *  want to materialize.
 * -(Comment 1) Since the FDom API allows named children to be embedded
 *  inside of the attributes, not needing to place then in childSet/childList we
 *  accumulate embedded (non-dom attributes) that we encounter. Embedded
 *  children will take precedence over childSet/childList.
 * -- Lazily allocates the object that accumulates embedded children.
 */
exports.generateDomNodeAndChildren =
function(tagOpen, tagClose, idRoot, doMarkup, doHandlers) {
  var tagAttrAccum = '', innerMarkup, finalRet = '', cssText =  '',
      header = tagOpen;
  var propKey, prop, props = this.props;
  var embeddedChildren, childList;
  header += idRoot;
  header += "' ";

  this._rootDomId = idRoot;

  /* Handler pack - if all handlers in a single group  */
  if (doHandlers && props[DYNAMIC_HANDLERS_KEY]) {
    registerHandlers(idRoot, props[DYNAMIC_HANDLERS_KEY]);
  }
  for (propKey in props) {
    if (!props.hasOwnProperty(propKey)) { continue; }
    prop = props[propKey];
    if (prop === null || typeof prop === 'undefined') { continue; }

    if (doHandlers && abstractHandlers[propKey]) {
      registerHandlerByName(idRoot, propKey, prop);
    }
    if (doMarkup) {
      if (propKey === CLASS_SET_KEY) {
        tagAttrAccum += "class='";
        tagAttrAccum += renderClassSet(prop);
        tagAttrAccum += "'";
      } else if (renderSimply[propKey]) {
        tagAttrAccum += tagAttrMarkupFragment(propKey, prop);
      } else if (propKey === STYLE_KEY) {
        cssText += escapeTextForBrowser(serializeInlineStyle(prop));
      } else if (propKey === POS_INFO_KEY) {
        cssText += escapeTextForBrowser(_extractAndSealPosInfoImpl(prop));
      } else if (propKey === CONTENT_KEY) {
        innerMarkup = escapeTextForBrowser(prop);
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML_KEY) {
        innerMarkup = prop;
      } else if (propKey === INNER_HTML_KEY) {
        throw FErrors.CANNOT_SET_INNERHTML;
      } else if (prop.props) {   // See (Comment 1)
        if (!embeddedChildren) {
          embeddedChildren = {};
        }
        embeddedChildren[propKey] = prop;
      }
    } else {
      if (prop.props) {
        if (!embeddedChildren) {
          embeddedChildren = {};
        }
        embeddedChildren[propKey] = prop;
      }
    }
  }

  if (embeddedChildren || props.childSet) {
    innerMarkup = generateDomChildrenByKey.call(
        this, idRoot, embeddedChildren || props.childSet, doMarkup, doHandlers);
  } else if (props.childList) {
    innerMarkup = generateDomChildrenByArray.call(
        this, idRoot, props.childList, doMarkup, doHandlers);
  }

  if (doMarkup) {
    finalRet += header;
    finalRet += tagAttrAccum;
    if (cssText) {
      finalRet += " style='";
      finalRet += cssText;
      finalRet += "'";
    }
    finalRet += '>';
    if (innerMarkup) {
      finalRet += innerMarkup;
    }
    finalRet += tagClose;
    return finalRet;
  }
};


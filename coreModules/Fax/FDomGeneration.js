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

/* FDomTraversal */
var FDomTraversal = require('./FDomTraversal');
var traverseChildStructures = FDomTraversal.traverseChildStructures;

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
 * @generateSingleDomAttributes:
 * -Does not return children markup.
 * -In this context, 'content'/'dangerouslySetInnerHtml' are not considered
 *  children, though they end up being child text nodes.
 * -Generates properties of a physical dom node for the open tag - this is
 *  analogous to controlSingleDomNode.
 * -Generates the content that goes:
 *        /----------here-----------\
 *    <div (attributes)> content/markup </div>
 * -content/markup should soon be modeled as children and at that point, this
 *  function should stop reasoning about them and deal strictly with the tag
 *  attributes.
 * -Performance explanation: If no one has augmented Object.prototype, iterating
 *  through object properties is faster, even if you know the range of values
 *  that might be found. See http://jsperf.com/obj-vs-arr-iteration . The checks
 *  for each member of the props are in order of likeliness to occur:
 * -Call with context 'this' equaling the instance of dom component that you
 *  want to materialize.
 * -The legacy child structure api would allow for children to be
 *  embedded as named attributes. We will discourage this, but not fail if we
 *  encounter them. An external process may extract these out and place them as
 *  childSet/childList.
 */
exports.generateSingleDomAttributes = function(idRoot) {
  var propKey, prop, props = this.props;
  var finalRet = ' id="';
  var cssText = '';

  finalRet += idRoot;
  finalRet += '" ';
  this._rootDomId = idRoot;

  for (propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    prop = props[propKey];
    if (prop === null || typeof prop === 'undefined') {
      continue;
    }

    if (propKey === CLASS_SET_KEY) {
      finalRet += 'class="';
      finalRet += renderClassSet(prop);
      finalRet += '"';
    } else if (renderSimply[propKey]) {
      finalRet += tagAttrMarkupFragment(propKey, prop);
    } else if (propKey === STYLE_KEY) {
      cssText += escapeTextForBrowser(serializeInlineStyle(prop));
    } else if (propKey === POS_INFO_KEY) {
      cssText += escapeTextForBrowser(_extractAndSealPosInfoImpl(prop));
    } else if (abstractHandlers[propKey]) {
      registerHandlerByName(idRoot, propKey, prop);
    }
  }

  if (cssText) {
    finalRet += " style='";
    finalRet += cssText;
    finalRet += "'";
  }
  finalRet += '>';

  if (props[CONTENT_KEY]) {
    finalRet += escapeTextForBrowser(props[CONTENT_KEY]);
  } else if (props[DANGEROUSLY_SET_INNER_HTML_KEY]) {
    /* This should actually be disabled entirely */
    finalRet += props[DANGEROUSLY_SET_INNER_HTML_KEY];
  }
  return finalRet;
};


/*
 * @generateDomChildren: The master generator. Will allocate, store references
 * to, and compute markup for all children of dom node with id @idRoot. It will
 * not compute markup or allocate children for any components other than its
 * immediate children. @childStructures represents the logical children that
 * this component needs to instantiate and track. If you were to look at
 * @childStructures, you'd see that it may be quite deep - but all of that depth
 * is flattened as we store references to those children.
 *
 * One thing that's a bit confusing is that we're dealing with two types of
 * "structures".
 *
 * 1. The structure of the "childStructures" param of this function.
 * 2. Actual dom structure of the dom nodes that eventually end up on the page:
 * (relationships between parent and children dom nodes).
 *
 * The structure of #1, may not be the same as #2. For example, someone could
 * specify children:
 * [ someSpan, { red: divOne, blue: divTwo } ]
 *
 * All of these children would become siblings, flattened into a single list.
 * If the parent's @idRoot is 'a', then the parent will have three children with
 * the following dom node id's:
 * Name of first child  : a.[0]         // Will contain someSpan
 * Name of second child : a.[1]{red}    // Will contain divOne
 * Name of third child  : a.[1]{blue}   // Will contain divTwo
 *
 * By convention '.' provides information about the DOM hierarchy. In this
 * example, the ids of the children will reflect that they are children of 'a'.
 * Everything that is is not a '.' only conveys the @childName that a parent may
 * reference a child by. The parent only sees these three children as:
 *
 * Name of first child  : a.X    (where X = "[0]")
 * Name of second child : a.Y    (where Y = "[1]{red}")
 * Name of third child  : a.Z    (where Z = "[0]{blue}")
 *
 * From the parent's perspective, the text that appears to be structured
 * "[1]{red}", is just a flat name by which it may reference a particular child.
 *
 * When you see those special names to the right of a "." -- you know that the
 * parent will store references to those children in @parent.logicalChildren
 * under those names. In this case, @parent.logicalChildren["[0]"] will have a
 * reference to the child that has a complete dom node id of "a.[0]".
 *
 * The special form of naming children encodes the form that the programmer
 * provided the children in.
 *
 * [brackets] imply that a child was specified in an array - and at which index.
 * {braces} imply that a child was specified in an object - and with which key.
 *
 * Encoding the form that was provided by the programmer is a convention that
 * helps determine programmer intent at "reconciliation time".
 *
 */

var generateDomChildren = function(idRoot, childStructures) {
  if (!childStructures) {
    return '';
  }

  var logicalChildren = this.logicalChildren = [];
  /*
   * If keeping track of child indices on generation slows down rendering
   * significantly, computation of childIndices may be removed from this
   * function. If so, the reconciliation process will realize this information
   * is missing and compute it lazily.
   */
  var childIndices = this.childIndices = {};
  var accum = '';
  var onChildFound = function(child, name, index) {
    FErrors.throwIf(child._rootDomId, FErrors.USING_CHILD_TWICE);
    child.name = name;
    logicalChildren.push(child);
    accum += child.genMarkup(idRoot + '.' + name, true, true);
    childIndices[name] = index;
  };
  var onEmptyChildFound = function(name, index) {
    logicalChildren.push(null);
    childIndices[name] = index;
  };
  traverseChildStructures(childStructures, onChildFound, onEmptyChildFound);
  return accum;
};


exports.generateDomChildren = generateDomChildren;


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
 *  ____    ______   __   __       _____  ____       
 * /\  _`\ /\  _  \ /\ \ /\ \     /\___ \/\  _`\     
 * \ \ \L\_\ \ \L\ \\ `\`\/'/'    \/__/\ \ \,\L\_\   
 *  \ \  _\/\ \  __ \`\/ > <         _\ \ \/_\__ \   
 *   \ \ \/  \ \ \/\ \  \/'/\`\     /\ \_\ \/\ \L\ \ 
 *    \ \_\   \ \_\ \_\ /\_\\ \_\   \ \____/\ `\____\
 *     \/_/    \/_/\/_/ \/_/ \/_/    \/___/  \/_____/
 *
 * Fax/Fax.js - core module for the FaxJs ui system.  Exposes most of the
 * functionality needed in order to create javascript applications. By
 * convention, call the exported module 'F'.
 *
 * var F = require('Fax');
 *
 */
var FaxBrowserUtils = require('./FaxBrowserUtils'),
    FaxEvent = require('./FaxEvent'),
    FEnv = require('./FEnv');

/* Forward declarations. */
var Fax;
var _extractAndSealPosInfoInlineImpl;

/**
  * A note about touch events:  See:
  * http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  * http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  * Clicks likely require mounting the event listener somewhere deep in
  * the dom tree (not at doc/window). Though we don't care much about
  * clicks because they have a 300 ms delay anyways and we roll our own
  * clicks.  What is supported, is actually very complicated and varies
  * by version of iOS - please populate and complete this table as you
  * find more information. On IOS5 overflow:touch-scroll divs, rumor has
  * it, that if you can listen to bubbled touch events somewhere deep in
  * the dom (document/one level deep?), if you stop bubbling, you can
  * prevent the rubber band.
  *
  * IOS5:
  * Using event bubbling - listening on dom element one level deep (away from body):
  *   Could not get any touch events.
  * Using event bubbling - listening on dom element two level deep (away from body):
  *   Could not get any touch events.
  * Using event bubbling - listening on document:
  *   Could get touch events, and could prevent default on the touch move.
  * Using event bubbling - listening on window:
  *   Could get touch events, and could prevent default on the touch move.
  *
  * Trap capture - listening on two deep from body
  *   Could NOT get touch events, and could NOT prevent default on the touch move.
  * Trap capture - listening on one deep from body
  *   Could NOT get touch events, and could NOT prevent default on the touch move.
  * Trap capture - listening on document
  *   Could get touch events, and could prevent default on the touch move.
  * Trap capture - listening on window
  *   Could get touch events, and could prevent default on the touch move.
  *
  * IOS4:
  * Using event bubbling - listening on dom element one level deep (away from body):
  *   Could get touch events, and could prevent default on the touch move.
  * Using event bubbling - listening on dom element two level deep (away from body):
  *   Could get touch events, and could prevent default on the touch move.
  * Using event bubbling - listening on document:
  *   Could get touch events, and could prevent default on the touch move.
  * Using event bubbling - listening on window:
  *   Could get touch events, and could prevent default on the touch move.
  *
  * Trap capture - listening on two deep from body
  *   Could get touch events, and could prevent default on the touch move.
  * Trap capture - listening on one deep from body
  *   Could get touch events, and could prevent default on the touch move.
  * Trap capture - listening on document
  *   Could get touch events, and could prevent default on the touch move.
  * Trap capture - listening on window
  *   Could NOT get touch events, and could NOT prevent default on the touch move.
  *
  * At least for the iOS world, it seems listening for bubbled touch
  * events on the document object is actualy the best for compatibility.
  *
  * In addition: Firefox v8.01 (and possibly others exhibited strange behavior
  * when mounting onmousemove events at some node that was not the document
  * element. The symptoms were that if your mouse is not moving over something
  * contained within that mount point (for example on the background) the top
  * level handlers for onmousemove won't be called. However, if you register
  * the mousemove on the document object, then it will of course catch all
  * mousemoves. This along with iOS quirks, justifies restricting top level
  * handlers to the document object only, at least for these movementy types of
  * events and possibly all events. There seems to be no reason for allowing
  * arbitrary mount points.
  * 
  */
var ERROR_MESSAGES = {
  OWNED_NOT_FOUND: "Could not find an object owned by you, at that projection path",
  UPDATE_STATE_PRE_PROJECT: "Cannot update state before your done projecting!!",
  CANNOT_SET_INNERHTML: "YOU CANNOT EVER SET INNERHTML. You must use the name " +
                        "That evokes what is really going on. dangerouslySetInnerHtml",
  NO_TOP_LEVEL_ID: "You must at least specify a top level id to mount at. The second " +
                   "parameter of renderTopLevelComponentAt must either be a string (the " +
                   "id to render at) or an object containing a mountAtId field",
  FAILED_ASSERTION: "Assertion Failed - no error message given",
  MUST_SPECIFY_TOP_COMP: "You must specify a top level constructor - or component " +
                         "declarative creation specification - i.e. {something:x}.Div(). " +
                         "What you specified appears to be null or not specified. If " +
                         "specifying a declarative block - make sure you execute " +
                         "Fax.using(moduleContainingTopmostComponent) in the file where " +
                         "you render the top level component.",
  CLASS_NOT_COMPLETE: "Class does not implement required functions!",
  NO_DOM_TO_HIDE: "No DOM node to hide!",
  CONTROL_WITHOUT_BACKING_DOM: "Trying to control a native dom element " +
                               "without a backing id",
  NAMESPACE_FALSEY: "Namespace is falsey wtf!",
  PROPERTIES_NOT_THERE: "Properties not present:",
  UNEXPECTED_PREINIT: "Unexpected pre-initialization",
  COULD_NOT_CREATE_SINGLE_DOM: "Could not create single dom node",
  MERGE_DEEP_ARRAYS: "mergeDeep not intended for merging arrays"
};


/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Let's say you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
function keyOf(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
}

/**
 * Input:  {key1: val1, key2: val2}
 * Output: {key1: key1, key2: key2}
 */
function keyMirror(obj) {
  var key, ret = {};
  if (!obj) {
    return obj;
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
}

/**
 * keyTest(someKey, {className: true}) => true/false Minification tolerant key
 * test. The minifiedKey *must* be minified. Q: How do you know it's minified?
 * A: It must have come from a key that was specified in javascript object, not
 * from any string anywhere. This is nowhere near as fast as comparing a string
 * key to a precomputed result of keyOf. Don't use unless you're just going for
 * readability.
 */
function minifiedKeyTest(minifiedKey, objWithKey) {
  return objWithKey(minifiedKey);
}


/**
 * Resolved key names. (See keyOf).
 */
var CLASS_SET_KEY = keyOf({ classSet: null });
var CLASSNAME_KEY = keyOf({ className: null });
var STYLE_KEY = keyOf({ style: null });
var POS_INFO_KEY = keyOf({ posInfo: null });
var CONTENT_KEY = keyOf({ content: null });
var DANGEROUSLY_SET_INNER_HTML_KEY = keyOf({ dangerouslySetInnerHtml: null });
var INNER_HTML_KEY = keyOf({ innerHtml: null });
var DYNAMIC_HANDLERS_KEY = keyOf({ dynamicHandlers: true });
var VALUE_KEY = keyOf({ value: true });

var T_KEY = keyOf({ t: true });
var L_KEY = keyOf({ l: true });
var B_KEY = keyOf({ b: true });
var R_KEY = keyOf({ r: true });
var H_KEY = keyOf({ h: true });
var W_KEY = keyOf({ w: true });


/**
 * Just so we can use this in declarative ternary expressions.
 */
function _throw(e) {
  throw e;
}

/**
 * If we use this, then a shim is absolutely required.
 */
function _eq(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * We need to flatten all of these package records. Either as an uglify
 * processor stage, or in the code itself. Accessing data through objects is 20%
 * slower in Safari, and 12% slower in IE8.
 * http://jsperf.com/accessing-object-method/2/edits
 */
var _Fax = {
  componentCurrentlyProjectingLock: null,
  beforeRendering: [],
  totalInstantiationTime: 0,
  idPrefixesAwaitingClearing: {}
};

_Fax.Fatal = function(str) {
  if(console && console.log) {
    console.log("[FATAL] :" + str);
  }
  throw str;
};

_Fax.Error = function(str) {
  if(console && console.log) {
    console.log("[ERROR] :" + str);
  }
};

_Fax.Info = function(str) {
  if(console && console.log) {
   console.log("[INFO] :" + str);
  }
};

function _assert(val, errorMsg) {
  if(!val) {
    throw errorMsg || ERROR_MESSAGES.FAILED_ASSERTION;
  }
}

function _clone(o) {
 return JSON.parse(JSON.stringify(o));
}

function _ser(o) {
 return JSON.stringify(o);
}

/**
 * Does not work correctly with tables etc.
 */
function _appendMarkup(elem, newMarkup) {
  var elemIdx, div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--) {
    elem.appendChild(elements[elemIdx]);
  }
}

/**
 * Does not work correctly with tables etc.
 */
var _singleDomNodeFromMarkup = function (newMarkup) {
  var elemIdx, div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--){
    return elements[elemIdx];
  }
  throw ERROR_MESSAGES.COULD_NOT_CREATE_SINGLE_DOM;
};

var _appendNode = function (elem, node) {
   elem.appendChild(node);
};

/**
 * Inserts node after insertAfterNode. If insertAfterNode is null, inserts it
 * after nothing, which is inserting it at the beginning.
 */
var _insertNodeAfterNode = function (elem, insertNode, insertAfterNode) {
  if (insertAfterNode) {
    if (insertAfterNode.nextSibling) {
       return elem.insertBefore(insertNode, insertAfterNode.nextSibling);
    } else {
      return elem.appendChild(insertNode);
    }
  } else {
    return elem.insertBefore(insertNode, elem.firstChild);
  }
};

_Fax.releaseMemoryReferences = function () {
  FaxEvent.releaseMemoryReferences(_Fax.idPrefixesAwaitingClearing);
  _Fax.idPrefixesAwaitingClearing = {};
};


/**
 * Must be set directly, not with a 'setAttribute' call. There are performance
 * gains to be had by setting all of the properties to be equal to the native
 * ones (no lookup needed), but who could stand to not use proper camel casing?
 * Also, application code can be more easily minified if using a lookup table.
 */
_Fax.controlDirectlyDomAttrsMap = {
  scrollTop: 'scrollTop', scrollLeft: 'scrollLeft'
};

/**
 * Properties that are not truly idempotent at the dom level, and therefore we
 * need to check their current values on the actual dom node before setting
 * them.  One example, is a text box value attribute. Setting the value will
 * reposition the cursor. Another example is src on an iframe - resetting it
 * will trigger a reload of the content and reflow.
 */
_Fax.controlDirectlyNonIdempotent = {
  value: 'value', src: 'src', checked: 'checked'
};

/**
 * We don't even do a lookup in this map for perf reasons.
 */
_Fax.controlDirectlyDomAttrsMapNoEscape = {
  dangerouslySetInnerHtml: 'innerHTML'
};

/**
 * We don't even do a lookup in this map for perf reasons.
 */
_Fax.controlDirectlyDomAttrsMapDoEscape = {
  content: 'innerHTML-ButFirstEscape-Not-A-Real-Property'
};


var logicalStyleAttrNamesMap = {
  boxSizing: 'box-sizing', boxShadow: 'box-shadow', textShadow: 'text-shadow',
  paddingRight: 'padding-right', paddingLeft: 'padding-left',
  paddingTop: 'padding-top', paddingBottom: 'padding-bottom',
  marginRight: 'margin-right', marginLeft: 'margin-left',
  marginTop: 'margin-top', marginBottom: 'margin-bottom',
  zIndex: 'z-index', backgroundImage: 'background-image',
  cursor: 'cursor', direction: 'direction',
  border: 'border', borderTop: 'border-top',
  fontSize: 'font-size', fontWeight: 'font-weight',
  fontFamily: 'font-family', lineHeight: 'line-height',
  fontColor: 'font-color', textTransform: 'text-transform',
  textDecoration: 'text-decoration', textAlign: 'text-align',
  borderLeft: 'border-left', borderRight: 'border-right',
  borderBottom: 'border-bottom', borderColor: 'border-color',
  position: 'position', backgroundColor: 'background-color',
  minHeight: 'min-height', maxHeight: 'max-height', minWidth: 'min-width',
  maxWidth: 'max-width', outline: 'outline'
};

/**
 * _controlUsingSetAttrDomAttrsMap: Attributes of a dom node that show up in the
 * tag header and may be controlled after they are rendered. This not only can
 * be used to check if an attribute is controllable but also determine the
 * appropriate name that we control the attribute with (sometimes they are
 * different (className->class)). classSet belong here as well - but since it needs
 * to be transformed it is dealt with specially.
 * Notice how 'type' is missing here - because it may not be controlled.
 */
var _controlUsingSetAttrDomAttrsMap = {
  margin: 'margin', marginRight: 'margin-right', marginLeft: 'margin-left',
  marginTop: 'margin-top', marginBottom: 'margin-bottom', padding: 'padding',
  paddingRight: 'padding-right', paddingLeft: 'padding-left',
  paddingTop: 'padding-top', paddingBottom: 'padding-bottom', width: 'width',
  height: 'height', className: 'class', href: 'href'
  /*, classSet: 'class-ButFirstCallFax.renderClassSet'*/
};

/**
 * We don't even do a lookup in this map for perf reasons.
 */
_Fax.controlUsingSetAttrDomAttrsMapButNormalizeFirst = {
  classSet: 'class-ButFirstCallFax.renderClassSet'
};

/**
 * Many of these are 'create' time only, meaning for performance reasons we
 * won't see if their values have changed and apply updates. Ones that will
 * be checked for changes are dangerouslySetInnerHtml,
 * content, value, className, classSet, checked(todo).
 */
var _allNativeTagAttributes = {
  // Using setattribute
  margin: 'margin', marginRight: 'margin-right', marginLeft: 'margin-left',
  tabIndex: 'tabindex',
  marginTop: 'margin-top', marginBottom: 'margin-bottom', padding: 'padding',
  paddingRight: 'padding-right', paddingLeft: 'padding-left',
  paddingTop: 'padding-top', paddingBottom: 'padding-bottom', width: 'width',
  height: 'height', className: 'class', href: 'href', src: 'src',
  // controlDirectlyDomAttrsMap
  value: 'value', scrollTop: 'scrollTop', scrollLeft: 'scrollLeft', name: 'name',
  checked: 'checked',
  // controlDirectlyDomAttrsMapNoEscape
  dangerouslySetInnerHtml: 'innerHTML',
  // controlDirectlyDomAttrsMapDoEscape
  content: 'innerHTML-ButFirstEscape-Not-A-Real-Property',
  // cannotEverControl
  type: 'type', htmlFor: 'htmlFor',
  // controlUsingSetAttrDomAttrsMapButNormalizeFirst
  classSet: 'class-ButFirstCallFax.renderClassSet'
};

/**
 * The one attribute I've found that can't be changed after rendering. The
 * problem is that the dom itself is not idempotent (at least ie8).
 */
_Fax.cannotEverControl = {
  type: 'type',
  htmlFor: 'for'
};

/**
 * Fax.markupDomTagAttrsMap: properties of the dom node that we can render in
 * the string markup. Usually, these can be controlled by executing
 * elem.setAttribute(fieldName, x), with a couple exceptions (type which can
 * never be controlled and value which must be set as a property).
 * content/dangerouslySetInnerHtml are exceptions to all rules, so we don't
 * talk much about it here - it's special cased in the rendering code.
 * classSet should belong here as well, but it needs to be normalized a special
 * way so it is not included here.
 */
var _markupDomTagAttrsMap = {
  margin: 'margin', marginRight: 'margin-right', marginLeft: 'margin-left',
  tabIndex: 'tabindex',
  marginTop: 'margin-top', marginBottom: 'margin-bottom', padding: 'padding',
  paddingRight: 'padding-right', paddingLeft: 'padding-left',
  paddingTop: 'padding-top', paddingBottom: 'padding-bottom',
  value: 'value', width: 'width', height: 'height',
  className: 'class', /*classSet: 'class-ButFirstCallFax.renderClassSet', */
  type: 'type', href: 'href', src: 'src',
  name: 'name', htmlFor: 'for', checked: 'checked'
};

/** Set of attribute names for which we do not append 'px'. */
var _cssNumber = {
  tabIndex: true, textDecoration: true, zoom: true, fillOpacity: true,
  fontWeight: true, opacity: true, orphans: true,
  zIndex: true, outline: true
};

/**
 * Convert a value into the proper css writable value. We shouldn't need to
 * convert NaN/null because we shouldn't have even gotten this far. The
 * attribute name should be logical (no hyphens).
 */
var _styleValue = function (logicalStyleAttrName, attrVal) {
  if(!isNaN(attrVal)) {
    return _cssNumber[logicalStyleAttrName] ? attrVal : (attrVal + 'px');
  }
  if(attrVal !== 0 && !attrVal) {
    return '';
  }
  return attrVal;
};


/**
 * tagDomAttrsFragment: For attributes that should be rendered in the opening
 * tag of a dom node, this will return that little fragment that should be
 * placed in the opening tag - for this single attribute.
 */
function _tagDomAttrMarkupFragment(tagAttrName, tagAttrVal) {
  var accum = _markupDomTagAttrsMap[tagAttrName];
  accum += "='";
  accum += FaxBrowserUtils.escapeTextForBrowser(tagAttrVal);
  accum += "'";
  return accum;
}

/**
 * _tagStyleAttrsFragment:
 * {width: '200px', height:0} => " style='width:200px;height:0'". Undefined
 * values in the style object are completely ignored. That makes declarative
 * programming easier.
 */
var _serializeInlineStyle = function (styleObj) {
  var accum = '', logStyleAttrName, styleAttrVal;
  for (logStyleAttrName in styleObj) {
    if (!styleObj.hasOwnProperty(logStyleAttrName)) {
      continue;
    }
    styleAttrVal = styleObj[logStyleAttrName];
    if (styleAttrVal !== undefined) {
      accum += logicalStyleAttrNamesMap[logStyleAttrName] || logStyleAttrName;
      accum += ":";
      accum += _styleValue(logStyleAttrName, styleAttrVal);
      accum += ";";
    }
  }
  return accum;
};


_Fax.clearBeforeRenderingQueue = function() {
  var i;
  if (_Fax.beforeRendering.length) {
    for (i = _Fax.beforeRendering.length - 1; i >= 0; i--) {
      _Fax.beforeRendering[i]();
    }
  }
};

_Fax.renderingStrategies = {
  standard: 'S',
  twoPassInteractionOptimized: 'TPVO',
  onlyInstantiate: 'OI',
  onlyMarkup: 'OM'
};

/**
 * Merely used to create a nicer form of instantiation when querying an ast.
 * Carries with it a definitative signal that this is a defered construction.
 */
_Fax._onlyGenMarkupOnProjection = function(projection, _rootDomId) {
  return new (projection.maker)(projection.props).genMarkup(_rootDomId, true, false);
};

/**
 * Renders a projection at a particular dom node, and returns the component
 * instance that was derived from the projection. In summary here's the flow of
 * data:
 * (ProjectingConstructor(Props))=>Projection
 * Render(Projection)=>ComponentInstance mounted on the dom somewhere.
 * Changes to the component instance will be reflected on the DOM automatically.
 */
_Fax.renderAt = function(projection, id, renderOptionsParam) {
  var renderOptions = renderOptionsParam || {},
      mountAt = document.getElementById(id),
      renderingStrategy = renderOptions.renderingStrategy ||
                          _Fax.renderingStrategies.standard;
      
  _Fax.clearBeforeRenderingQueue();
  _Fax.preRenderingAnything(mountAt, renderOptions);

  
  /**
   * If doing two pass optimal rendering - we perform an initial pass that does
   * not concern itself with registering events - instead only generating
   * markup. The user's experience will not be blocked by event handlers being
   * registered and other objects needing to be allocated. Currently the
   * difference will be very small. But, this allows the rendering path to be
   * augmented with highly optimized versions of the rendering algorithm.
   */
  var start = (new Date()).getTime();
  var nextSibling = mountAt.nextSibling,
      parent = mountAt.parentNode,
      componentInstance = (new (projection.maker)(
          projection.props, projection.instantiator)),
      shouldGenMarkupFirstPass =
          renderingStrategy !== _Fax.renderingStrategies.onlyInstantiate,
      shouldRegHandlersFirstPass =
          renderingStrategy === _Fax.renderingStrategies.standard ||
          renderingStrategy === _Fax.renderingStrategies.onlyInstantiate,
      markup = componentInstance.genMarkup(
          '.top', shouldGenMarkupFirstPass, shouldRegHandlersFirstPass);

  _Fax.totalInstantiationTime += ((new Date()).getTime() - start);

  /*
   * In some browsers, you'd be better off *not* removing the element
   * before setting the innerHTML - surprising - as much as a 20% difference in
   * total rendering time!
   */
  parent.removeChild(mountAt);
  mountAt.innerHTML = markup;
  if(nextSibling) {
    parent.insertBefore(mountAt,nextSibling);
  } else {
    parent.appendChild(mountAt);
  }

  /**
   * If we are performing an optimized rendering, then the first pass would have
   * generated the markup and dumped it into the DOM. In that case we still need
   * event handlers attached to the top level, and objects properly allocated.
   * The setTimeout might not make a difference - but I could imagine some
   * browsers waiting until the 'next' event loop to actually display the
   * complete content - and we wouldn't want to block that. No harm defering
   * either way.
   */
  if (renderingStrategy === _Fax.renderingStrategies.twoPassInteractionOptimized) {
    setTimeout(function() { componentInstance.genMarkup('.top', false, true); }, 10);
  }

  return componentInstance;
};


/**
 * Simple utility method that renders a new instance of a component (as
 * indicated by the constructor reference passed as first arg) at some id on the
 * dom. This is different than renderAt, because it 'wires in' some global
 * signals as properties of that component instance. Meaning, you can imaging
 * the browser itself projecting out a projection that is of your component
 * type. This means that your component can expect top level browser attributes
 * such as browser dimensions, cookies and can expect to be reprojected when
 * these things change. The main use case is your main application component.
 * Careful not to read the viewport dims unless we know the window actually
 * changed, so as not to trigger a reflow needlessly.
 */
_Fax.renderTopLevelComponentAt = function(ProjectionOrProjectionConstructor,
                                          renderOptions) {
  var mountAtId = renderOptions && (renderOptions.charAt ? renderOptions :
                      renderOptions.mountAtId);
  var dims = FaxBrowserUtils.getViewportDims();
  var cookies = FaxBrowserUtils.readCookie() || {};
  _assert(mountAtId, ERROR_MESSAGES.NO_TOP_LEVEL_ID);
  _assert(ProjectionOrProjectionConstructor, ERROR_MESSAGES.MUST_SPECIFY_TOP_COMP);

  var baseTopLevelProps = {
    chromeHeight : dims.viewportHeight,
    chromeWidth : dims.viewportWidth,
    cookies: cookies
  };

  /* The caller did not actually call the projection constructor - they just gave
   * us a reference to that projection constructor - we'll do it for them. */
  var callerPassedInProjection = ProjectionOrProjectionConstructor.maker;
  var topLevelCreateData = _Fax.mergeStuff(
        baseTopLevelProps,
        callerPassedInProjection ? ProjectionOrProjectionConstructor.props : {}),
      topLevelProjection =
        (callerPassedInProjection ? ProjectionOrProjectionConstructor :
         ProjectionOrProjectionConstructor(topLevelCreateData));

  if (renderOptions &&
      renderOptions.appStyle &&
      document.body.className.indexOf('nover') === -1) {
    document.body.className += ' nover';
  }
  var renderedComponentInstance =
      _Fax.renderAt(topLevelProjection, mountAtId, renderOptions);

  /**
   * Refresher function that does a control on the rendered dom node whenever
   * something in the top level data pipeline changes. This wipes out any
   * existing handler.
   */
  if (renderOptions.applicationResizeBatchTimeMs) {
    FaxEvent.applicationResizeBatchTimeMs =
        renderOptions.applicationResizeBatchTimeMs;
  }

  /**
   * For all of these browser events - we need to gracefully merge in the properties
   * that were already set (and merged in) by the top level.
   */
  FaxEvent.applicationResizeListener = function() {
    var updateProps = {
      chromeHeight : FEnv.viewportHeight,
      chromeWidth : FEnv.viewportWidth,
      cookies: cookies
    };
    renderedComponentInstance.doControl(
        _Fax.mergeStuff(updateProps, renderedComponentInstance.props));
  };

  /**
   * We don't requery the dims when the cookie changes.
   */
  FaxBrowserUtils._onCookieChange = function () {
    cookies = FaxBrowserUtils.readCookie() || {};
    var updateProps = {
      chromeHeight : FEnv.viewportHeight,
      chromeWidth: FEnv.viewportWidth,
      cookies: cookies
    };
    renderedComponentInstance.doControl(
      _Fax.mergeStuff(updateProps, renderedComponentInstance.props));
  };

  return renderedComponentInstance;
};


/**
 * Merges into an existing object - as in "merges" then "stuffs" into ths.
 * Since we have the luxury of mutating ths, we can apply a shortcut when we see
 * that merge is falsey - we can just return ths!
 */
_Fax.mergeStuff = function(ths, merge) {
  var aKey;
  for (aKey in merge) {
    if (!merge.hasOwnProperty(aKey)) {
      continue;
    }
    ths[aKey] = merge[aKey];
  }
  return ths;
};

/**
 * Fax.merge: Two has priority over one. This version only works on two objs
 * accessing arguments can be very slow, since the browser has to instantiate a
 * new object to represent them, if it sees you reference 'arguments' in the
 * code. Since this is used in critical sections of code - the redundancy is
 * welcomed. Let's make an array based one for the 'mergeN' case.
 */
_Fax.merge = function(one, two) {
  var ret = {}, aKey, first = one || {}, second = two || {};
  for (aKey in first) {
    if (first.hasOwnProperty(aKey)) {
      ret[aKey] = first[aKey];
    }
  }
  for (aKey in second) {
    if (second.hasOwnProperty(aKey)) {
      ret[aKey] = second[aKey];
    }
  }
  return ret;
};

/**
 * A quick lookup to determine if a field in a tag projection construction is
 * something supported by the dom, as opposed to a child member.
 */
var _allNativeTagAttributesAndHandlerNames =
    _Fax.merge(_allNativeTagAttributes, FaxEvent.abstractHandlerTypes);

_Fax.mergeThree = function(one, two, three) {
  var ret = {}, aKey, first = one || {}, second = two || {}, third = three || {};

  for (aKey in first) {
    if (first.hasOwnProperty(aKey)) {
      ret[aKey] = first[aKey];
    }
  }
  for (aKey in second) {
    if (second.hasOwnProperty(aKey)) {
      ret[aKey] = second[aKey];
    }
  }
  for (aKey in third) {
    if (third.hasOwnProperty(aKey)) {
      ret[aKey] = third[aKey];
    }
  }
  return ret;
};

/*
 * Will not work on arrays. Undefined is used as a signal to not place that
 * element into the returned object. obj2 has precedence over obj1. This
 * function is not intended to merge two objects, but rather to update one
 * object with another object that is used as the signal for change.  May or may
 * not mutate obj1. If obj1 is a terminal, it will not mutate obj1 and instead
 * return the new reference. Iff obj1 is 'objecty' and obj2 is 'objecty' then
 * this will mutate obj1. Probably doesn't work in some edge cases.
 */
_Fax.mergeDeep = function(obj1, obj2) {
  var obj2Key;
  if(obj1 instanceof Array || obj2 instanceof Array) {
    throw ERROR_MESSAGES.MERGE_DEEP_ARRAYS;
  }
  var obj2Terminal =
    obj2 === undefined || obj2 === null || typeof obj2 === 'string' ||
    typeof obj2 === 'number' || typeof obj2 === 'function' || obj2 === true ||
    obj2 === false;

  if(obj2Terminal) {
    return obj2;
  }
  var obj1Terminal =
    obj1 === undefined || obj1 === null || typeof obj1 === 'string' ||
    typeof obj1 === 'number' || typeof obj1 === 'function' || obj1 === true ||
    obj1 === false;

  // Wipe out
  if(obj1Terminal) {
    obj1 = obj1 || {};
  }

  for (obj2Key in obj2) {
    if (!obj2.hasOwnProperty(obj2Key)) {
      continue;
    }
    obj1[obj2Key] = _Fax.mergeDeep(obj1[obj2Key], obj2[obj2Key]);
  }

  return obj1;

};

function childGenerator(idRoot, childProjections, doMarkup, doHandlers) {
  var childIdRoot,
      childKey, childProj,  // Child projection
      newChild, markupAccum,
      myChildren = this.children = {};

  if (doMarkup) {
    markupAccum = '';
    for (childKey in childProjections) {
      if (!childProjections.hasOwnProperty(childKey)) { continue; }
      childProj = childProjections[childKey];
      childIdRoot = idRoot;
      childIdRoot += '.';
      childIdRoot += childKey;
      if (childProj) {
        newChild = new (childProj.maker)(childProj.props, childProj.instantiator);
        myChildren[childKey] = newChild;
        markupAccum += newChild.genMarkup(childIdRoot, doMarkup, doHandlers);
      }
    }
    return markupAccum;
  } else {
    for (childKey in childProjections) {
      if (!childProjections.hasOwnProperty(childKey)) { continue; }
      childProj = childProjections[childKey];
      childIdRoot = idRoot;
      childIdRoot += '.';
      childIdRoot += childKey;
      if (childProj) {
        newChild = new (childProj.maker)(childProj.props, childProj.instantiator);
        myChildren[childKey] = newChild;
        newChild.genMarkup(childIdRoot, doMarkup, doHandlers);
      } else if(!childProj && typeof childProj !== 'undefined') {
        myChildren[childKey] = null;
      }
    }
  }
}

/*
 * Soon - for native dom components and any other multichild components, if the
 * properties are an array - the build stage (meaning projection constructors,
 * will fold all elements in an array form properties into a single one - so
 * that we can avoid the concept of overrides and perf hit of merging at several
 * layers. Instead, we'll just merge once before rendering/updating - or let the
 * deepest code simply work on arrays. Another (better solution, is to have a
 * delayed merge function, that queues up merge after merge after merge, but
 * doesn't iterate in the process - simply defers that for the latest point.
 */
function childReconciler(nextProps, ignoreProps, onlyConsiderProps) {
  if (!this._rootDomId) { throw ERROR_MESSAGES.CONTROL_WITHOUT_BACKING_DOM; }

  var myChildren = this.children, deallocChildren = {}, keepChildren = {},
      curChild, curChildKey, deallocChild, deallocChildKey, newMarkup,
      rootDomId = this._rootDomId, rootDomIdDot = rootDomId + '.',
      deallocId, domNodeToRemove,
      newProjection;

  if (nextProps === ignoreProps) { return; }

  for (curChildKey in myChildren) {
    if (!myChildren.hasOwnProperty(curChildKey) ||
        onlyConsiderProps && !onlyConsiderProps[curChildKey] ||
        ignoreProps && ignoreProps[curChildKey]) {
      continue;
    }

    curChild = myChildren[curChildKey];
    newProjection = nextProps[curChildKey];
    /* May as well control them now while we have them. */
    if(curChild && newProjection && newProjection.maker &&
      newProjection.maker === curChild.constructor) {
      /* where the new child is a component, and appears to be the same as the
       * previous child, let's just control what's there.*/
      keepChildren[curChildKey] = curChild;
      curChild.doControl(newProjection.props);
    } else {
      /* Otherwise: Ensure no resources for this child, whether or not there
       * ever were any to begin with. This child may have been null, or not a
       * real component.  Otherwise, we have the same name but different type.
       * It likely even have the same interface. It's not even clear what to do
       * here. I would opt for eventually saying if the child is named the
       * exact same, then they need to have the exact same 'type'.  If there's
       * different subtypes etc, you should put them in a different child key
       * that is conditionally included in the projection.  This child should
       * not only go away (have resources deallocated) but also be recreated.
       * It may have been falsey in the first place in which case it will be
       * idempotently deleted before recreating.  #todoapi: Should we do
       * something similar as all of this with high level components?  */
      deallocChildren[curChildKey] = curChild;
    }
  }

  /** Ensure that no-longer-existing children resources are deallocated. */
  for (deallocChildKey in deallocChildren) {
    if (!deallocChildren.hasOwnProperty(deallocChildKey)) { continue; }
    deallocChild = myChildren[deallocChildKey];
    if (deallocChild && deallocChild.doControl) {
      deallocId = rootDomIdDot + deallocChildKey;
      domNodeToRemove =
          deallocChild.rootDomNode ||
          document.getElementById(deallocId);

      domNodeToRemove.parentNode.removeChild(domNodeToRemove);
      delete myChildren[deallocChildKey];
      _Fax.idPrefixesAwaitingClearing[deallocId] = true;
    }
  }
  domNodeToRemove = null; // paranoid memory

  var lastIteratedDomNodeId = null,
      newChild, propKey, prop, newChildId;

  for (propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey) ||
        onlyConsiderProps && !onlyConsiderProps[propKey]) {
      continue;
    }

    /* Make sure the memory won't be cleared for this - it could have been
     * pending a clear, but then readded as a child before we had the
     * opportunity to clean up memory.  */
    prop = nextProps[propKey];
    newChildId = rootDomIdDot + propKey;
    delete _Fax.idPrefixesAwaitingClearing[newChildId];
    if (myChildren[propKey]) {
      lastIteratedDomNodeId = newChildId;
    } else {
      if ((!ignoreProps || !ignoreProps[propKey]) &&
            prop && prop.maker) {
        // If there's not yet a child and we want to allocate a component
        newChild = new (prop.maker)( prop.props, prop.instantiator);
        newMarkup = newChild.genMarkup(newChildId, true, true);
        myChildren[propKey] = newChild;
        var newDomNode = Fax.singleDomNodeFromMarkup(newMarkup);
        Fax.insertNodeAfterNode(
          this.rootDomNode || (this.rootDomNode = document.getElementById(rootDomId)),
          newDomNode,
          document.getElementById(lastIteratedDomNodeId));
        lastIteratedDomNodeId = newChildId;
      }
    }
  }
}

/**
 * Could reuse MixinExcluded but these loops block rendering - let's just have
 * code duplication.
 */
var Mixin = function(constructor, methodBag) {
  var methodName;
  for (methodName in methodBag) {
    if (!methodBag.hasOwnProperty(methodName)) {continue;}
    constructor.prototype[methodName] = methodBag[methodName];
  }
};
var MixinExcluded = function(constructor, methodBag, blackList) {
  var methodName;
  for (methodName in methodBag) {
    if (!methodBag.hasOwnProperty(methodName)) {continue;}
    if (blackList[methodName]) {continue;}
    constructor.prototype[methodName] = methodBag[methodName];
  }
};
_Fax.MakeComponentClass = function(spec, addtlMixins) {
  var specKey = null, mixinKey = null;
  var prototypeBlackList = {initState: true};
  var j;
  var ComponentClass = function(initProps, instantiator) {
    this.props = initProps || {};

    this._strigifiedProps = null;
    this.state = {};
    if (spec.initState) {
      if (typeof spec.initState === 'function') {
        this.state = spec.initState.call(this, initProps);
      } else {
        /* A literal data blob, which we clone because we mutate the state, and
         * the initState object is shared amongst all instances. This is a
         * bottle neck for rendering! It would be better to have a functions
         * initState() */
        this.state = _clone(spec.initState);
      }
    }
  };
  MixinExcluded(ComponentClass, spec, prototypeBlackList);
  Mixin(ComponentClass, _Fax.universalPublicMixins);
  Mixin(ComponentClass, _Fax.universalPrivateMixins);
  for (j=0; j < addtlMixins.length; j++) {
    Mixin(ComponentClass, addtlMixins[j]);
  }
  if (!ComponentClass.prototype._genMarkupImpl ||
   !ComponentClass.prototype.project) {
    _Fax.Error(ERROR_MESSAGES.CLASS_NOT_COMPLETE);
  }

  return ComponentClass;
};

_Fax.universalPublicMixins = {
  doControl: function(props) {
    if (this._propertyTrigger) {
      var nextStateFragment = this._propertyTrigger(props);
      if (nextStateFragment) {
        this.justUpdateState(nextStateFragment);
      }
    }
    this.props = props;
    this._doControlImpl();
  },

  genMarkup: function(idRoot, gen, events) {
    var ret;
    if(!events && this._optimizedRender) {
      return this._optimizedRender(idRoot);
    } else {
      this._rootDomId = idRoot;
      return this._genMarkupImpl(idRoot, gen, events);
    }
  }
};

_Fax.universalPrivateMixins = {
  /**
   * Just updates the state without automatically reprojecting.
   */
  justUpdateState: function(nextStateFragment) {
    _Fax.mergeStuff(this.state, nextStateFragment);
  },
  justUpdateStateDeep: function(nextStateFragment) {
    this.state = _Fax.mergeDeep(this.state, nextStateFragment);
  },

  /**
   * Nice way to define a function literal, that when invoked, updates the
   * state, causing a reprojection.
   * var button = {
   *   onClick: this.updater( {hasButtonBeenClicked: true} )
   * }.Button();
   */
  updater: function(fragLiteral) {
    var that = this;
    return function() {
      that.updateState(fragLiteral);
    };
  },

  /**
   * In some cases, trying to determine what has changed in order to stop
   * propagation of changes isn't worth it. It's faster to just propagate the
   * changes. As soon as we start seeing really slow behavior without easy
   * workarounds, we will start to infer a data potential-dependency and use
   * that information to make updates faster. It's not as bad as you would think
   * it would be.
   * todo: queueing of pushings, deterministic ordering, need to think about
   * that.
   */
  updateState: function(nextStateFragment) {
    if (this.componentCurrentlyProjectingLock) {
      throw ERROR_MESSAGES.UPDATE_STATE_PRE_PROJECT;
    }
    this.justUpdateState(nextStateFragment);
    this._doControlImpl();
    return true;
  },

  updateStateDeep: function(nextStateFragment) {
    if (this.componentCurrentlyProjectingLock) {
      throw ERROR_MESSAGES.UPDATE_STATE_PRE_PROJECT;
    }
    this.justUpdateStateDeep(nextStateFragment);
    this._doControlImpl();
    return true;
  },

  _reproject: function() {
    this._doControlImpl();
  },

  /**
   * To be implemented: Should accept a string
   * 'projection.contained.1.contained' This is a can of worms, and encourages a
   * paradigm that I'm choosing not to focus on for the time being. However, it
   * would be great if someone implemented something like this for the rare
   * cases where declarative programming isn't as easy or concise.
   */
  _childAt: function(s) {
  },

  stateUpdater: function (funcOrFragment) {
    var ths = this;
    if (!funcOrFragment) {
      return funcOrFragment;
    }
    return (typeof funcOrFragment === 'function') ?
        function(/*arguments*/) {
          ths.updateState(funcOrFragment.apply(ths, arguments));
        } :
        function(/*arguments*/) {
          ths.updateState(funcOrFragment);
        };
    
  },

  stateUpdaterCurry: function (func /*, other arguments*/) {
    var curriedArgs = Array.prototype.slice.call(arguments, 1);
    var ths = this;
    return function () {
      ths.updateState(func.apply(ths,
          curriedArgs.concat(Array.prototype.slice.call(arguments))));
    };
  }

};

/**
 * Maybe invokes the function, if it exists that is.
 */
_Fax.maybeInvoke = function(f) {
  if (f) {
    f();
  }
};

/**
 * Invokes a handler *now* for each element in the cross product of two arrays.
 * The 'now' distinction is important as it allows the opportunity to mutate
 * whatever context happens to be in the closure of the handler.  Poorly named
 * as it does not return the cross product, but just provides an opportunity for
 * the handler to be invoked for each combination of arr elems.
 */
_Fax.crossProduct = function(arr1, arr2, handler) {
  var i, j;
  for (i=0; i < arr1.length; i++) {
    for (j=0; j < arr2.length; j++) {
      handler(arr1[i], arr2[j]);
    }
  }
};

/**
 * Finds an index of an item that has a particular structure. The structure is
 * checked by using stringify.
 */
_Fax.indexOfStruct = function(searchArr, obj) {
  var i;
  for (i=0; i < searchArr.length; i=i+1) {
    if (_eq(obj, searchArr[i])) {
      return i;
    }
  }
  return -1;
};

_Fax.structExists = function (searchArr, obj) {
  return _Fax.indexOfStruct(searchArr, obj) !== -1;
};

/**
 * Fax.objMap - the key should probably be the second parameter to play nicer
 * with other functions.
 */
_Fax.objMap = function (obj, fun, context) {
  var ret = {}, key, i = 0;
  if (!obj) {
    return obj;
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = fun.call(context || this, key, obj[key], i++);
  }
  return ret;
};

_Fax.swapKeyOrder = function(obj, singleKeyed, anotherSingleKeyed) {
  // todo
};

/**
 * Accepts an object, and for each own property, calls mapper, while
 * constructing an array to return.
 */
_Fax.objMapToArray = function(obj, mapper, context) {
  var ret = [], aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey)) {
      ret.push(mapper.call(context || this, aKey, obj[aKey]));
    }
  }
  return ret;
};

/**
 * Mapper must return {key: x, value: y} If mapper returns undefined, no entry
 * in the ret will be made.  It must not return null.
 */
_Fax.arrMapToObj = function(arr, mapper) {
  var ret = {}, res, i, len = arr.length;
  for(i=0; i < len; i++) {
    res = mapper(arr[i], i);
    ret[res.key] = res.value;
  }
  return ret;
};

/**
 * Mapper should just return the value for which this function will create
 * string keys for. Each straing key will not appear to be numeric, and
 * therefore will experience order preservation. You can't decide the key
 * though, it will simply be 'nNumber' (so as not to appear numeric).
 */
_Fax.arrMapToObjAutoKey = function(arr, mapper) {
  var ret = {}, i, len = arr.length;
  for(i=0; i < len; i++) {
    ret['n' + i] = mapper(arr[i], i);
  }
  return ret;
};


/**
 * Fax._keys: #todoperf reduce to native when available #todocustombuild
 */
_Fax.keys = function(obj) {
  var ret = [], aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey)) {
      ret.push(aKey);
    }
  }
  return ret;
};

_Fax.keyCount = function(obj) {
  return _Fax.keys(obj).length;
};

/**
 * Fax.objSubset - selects a subset of object fields as indicated by the select
 * map.  Any truthy value in the corresponding select map will indicate that the
 * corresponding object field should be sliced off into the return value.
 * #todoperf reduce to native when available. #todocustombuild.
 */
_Fax.objSubset = function(obj, selectMap) {
  var ret = {}, aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey) && selectMap[aKey]) {
      ret[aKey] = obj[aKey];
    }
  }
  return ret;
};

/**
 * Fax.objExclusion: Compliment to Fax.objSubset.
 */
_Fax.objExclusion = function(obj, filterOutMapParam) {
  var ret = {}, filterOutMap = filterOutMapParam || {}, aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey) && !filterOutMap[aKey]) {
      ret[aKey] = obj[aKey];
    }
  }
  return ret;
};


_Fax.copyProps = function(obj, obj2) {
  var key;
  for (key in obj2) {
    if (!obj2.hasOwnProperty(key)) {
      continue;
    }
    obj[key] = obj2[key];
  }
  return obj;
};

_Fax.shallowClone = function(obj) {
  return _Fax.copyProps({}, obj);
};


/**
 * Fax.standardComponentMixins. Most components you define will be a 'standard'
 * component. Meaning it only really has a single child. Even if that single
 * child is a 'MultiDynamic' child with several children - your component only
 * has a single child.
 */
_Fax.standardComponentMixins = {
  _doControlImpl: function() {
    this.child.doControl(this._getProjection().props);
  },
  _genMarkupImpl: function(idSpaceSoFar, gen, events) {
    var projection = this._getProjection();
    this.child = new projection.maker(
        projection.props,
        projection.instantiator);
    return this.child.genMarkup(idSpaceSoFar, gen, events);
  },

  _getProjection: function() {
    _Fax.componentCurrentlyProjectingLock = this;
    var projection = this.project();
    _Fax.componentCurrentlyProjectingLock = null;
    return projection;
  },

  _controlDomNode: function (path, domAttrs) {
    var normalized = path.replace('projection', '');
    _Fax.controlPhysicalDomByNodeOrId(
        document.getElementById(this._rootDomId + normalized),
        this._rootDomId + normalized,
        domAttrs,
        null);
  },
  _childDom: function (path) {
    var normalized = path.replace('projection', '');
    return document.getElementById(this._rootDomId + normalized);
  }
  
};

/**
 * Fax.orderedComponentMixins: A component that houses an array of components,
 * each having the same 'type'.  Manages construction/destruction of DOM
 * elements in an inefficient manner.  This should only be used with an array
 * projection of components for which each element is the exact same type
 * (accepts the same props) and where each element is indistinguishable from the
 * others (each holds no state.)
 * Todo: Have this clean up memory in the same way that the multi dynamic does.
 */
_Fax.orderedComponentMixins = {

  /**
   * At this point, this.children is as before appending or deleting any
   * children, but props is the new properties.  TODO: get this to work with
   * i.e. table elements
   */
  _doControlImpl: function() {
    var child, childToReconcile, newChild, projection, newMarkup,
        jj, ii, kk, domNodeToRemove,
        projectionToReconcile = this.props,
        rootDomIdDot = this._rootDomId + '.',
        numAlreadyExistingThatShouldRemain =
            Math.min(this.children.length, projectionToReconcile.length);
    for (jj = 0; jj < numAlreadyExistingThatShouldRemain; jj++) {
      child = this.children[jj];
      child.doControl(projectionToReconcile[jj].props);
    }

    /**
     * Delete all material that that has been lost.
     */
    for (ii = projectionToReconcile.length; ii < this.children.length; ii++) {
      domNodeToRemove = document.getElementById(rootDomIdDot + ii);
      if (!domNodeToRemove) {
        _Fax.Error(ERROR_MESSAGES.NO_DOM_TO_HIDE);
      }
      domNodeToRemove.parentNode.removeChild(domNodeToRemove);
    }

    /*
     * Allocate new material. #todoie, #todoreplacewithframework
     * http://stackoverflow.com/questions/494143/
     * how-do-i-create-a-new-dom-element-from-an-html-string-using-built-in-dom-methods
     */
    for (kk = numAlreadyExistingThatShouldRemain; kk < projectionToReconcile.length; kk++) {
      childToReconcile = projectionToReconcile[kk];
      newChild = new (childToReconcile.maker)(
        childToReconcile.props, childToReconcile.instantiator);
      newMarkup = newChild.genMarkup(rootDomIdDot + kk, true, true);
      this.children[kk] = newChild;
      _appendMarkup(document.getElementById(this._rootDomId), newMarkup);
    }
    this.children.length = projectionToReconcile.length;
  },


  /**
   * #todoperf: get a queued implementation and special data structure
   *    to accommodate. Or good enough data dependency inference.
   * #todoperf: Get this to work without having to add an additional element
   *   It's almost easy, except for the fact that if this is inside of a multi
   *   component, and the size of the projection falls to zero, we loose
   *   the handle to where we need to add elements back.
   *
   * WARNING: This class is probably not what you want. Any notion of identity
   * is lost when included in an Ordered. Element 2 might have state associated
   * with it, but if a new item is allocated and placed at index zero, pushing
   * all other elements forward, the encapsulated state of original element 2 is
   * now controlled by the control of original element 1.  You likely want
   * something that keeps track of identity *and* order, native javascript
   * objects being the perfect solution - use MultiDynamic which accomplishes this.
   */
  _genMarkupImpl: function(idSpaceSoFar, gen, events) {
    var jj, projection, childKey, childProjection, markupAccum, newChild;
    markupAccum = '<div id="';
    markupAccum += idSpaceSoFar;
    markupAccum += '" style="display:inherit">';
    projection = this.props;
    this.children = [];
    for (jj = 0; jj < projection.length; jj++) {
      childProjection = projection[jj];
      newChild = new (childProjection.maker)(
          childProjection.props,
          childProjection.instantiator);
      markupAccum += newChild.genMarkup(idSpaceSoFar+('.' + jj), gen, events);
      this.children[jj] = newChild;
    }
    markupAccum += "</div>";
    return markupAccum;
  },

  /**
   * #todomicroopt: Make it so this is the default projection.
   */
  project: function() {
    return this.props;
  }
};



/**
 * MultiDynamic Component Mixins: currently the only client of the
 * multiChildMixins, but that could change soon.
 */
_Fax.multiDynamicComponentMixins = {
  _doControlImpl: function() {
    this._childReconciler(this.props);
  },
  _genMarkupImpl: function(idRoot, doMarkup, doHandlers) {
    var ret;
    if (doMarkup) {
      ret = '<div id="';
      ret += idRoot;
      ret += '" style="display:inherit">';
      ret += this._childGenerator(idRoot, this.props, doMarkup, doHandlers);
      ret += "</div>";
      return ret;
    } else {
      this._childGenerator(idRoot, this.props, doMarkup, doHandlers);
    }
  },

  project: function() {
    return this.props;
  },

  _childReconciler: childReconciler,

  _childGenerator: childGenerator
};

/**
 * Fax.Componentize : Makes a standard component given a specification. A
 * 'standard' component is one that projects a single child. This method
 * generates a projection constructor from the component specs.  The returned
 * projecting constructor is suitable for invocation in the standard manner, or
 * as a tail constructor, if it is appended to Object.prototype.
 *
 * @param component spec - an obj of type {project: Props->Projection<Child>}
 * @return projection constructor of type {props: Props, maker: unit->Child}
 */
_Fax.Componentize = function(spec) {
  var Constructor =
      Fax.MakeComponentClass(spec, [_Fax.standardComponentMixins]);
  var ProjectingConstructor = function(propsArgs) {
    var props = propsArgs || this;
    return {
      instantiator: _Fax.componentCurrentlyProjectingLock,
      props: props,
      maker: Constructor
    };
  };
  ProjectingConstructor.originalSpec = spec;
  return ProjectingConstructor;
};

/**
 * Fax.ComponentizeAll - Faxifies all members in an object, actually replaces
 * the members with their componentized versions.
 */
_Fax.ComponentizeAll = function(obj) {
  var ret = {}, memberName;
  for (memberName in obj) {
    if (!obj.hasOwnProperty(memberName)) {
      continue;
    }
    var potentialComponent = obj[memberName];
    if (potentialComponent &&
        typeof potentialComponent !== 'function' &&
        potentialComponent.project) {
      ret[memberName] = _Fax.Componentize(potentialComponent);
    } else {
      // otherwise assume already faxified.
      ret[memberName] = potentialComponent;
    }
  }
  return ret;
};

/**
 * _Fax.controlPhysicalDomByNodeOrId: Useful when you have a dom node or at least
 * an id of an element, properties, and want to control the entire node based on
 * those properties.  This doesn't reconcile event handlers, just the physical
 * dom node. If the dom node was actually attempted to be updated, we return the
 * dom node, otherwise we return null. The main reason for that odd return
 * behavior is for performance - we lazilly cache dom nodes when they're
 * updated, and only when they're updated.
 *
 * It seems (at least when objects are "equal", but not the same memory reference),
 * it's faster to do a JSON.stringify. When objects are memory reference equal, or
 * are not 'equal' it's probably faster to do _.isEqual because the operation can
 * abort quickly when it finds that they are the exact same memory reference or
 * as soon as it finds a difference. In the overprojecting case, we need to optimize
 * for the case where they are different memory references, yet 'equal', as that
 * will be the most comonly encountered case, hence use of JSON.stringify.
 *
 * http://jsperf.com/isequal-vs-json-stringify.
 * Note: I've found at least one case where the best thing to do is just check
 * individual fields, when you know them ahead of time and there aren't that many
 * fields to check: http://jsperf.com/positioninfoequal (We should also try the
 * same thing on other fields besides position - when we know the fields)
 *
 * A good post: http://www.phpied.com/the-new-game-show-will-it-reflow/
 *
 * Optimal strategy using textContent. Look for changes in the data. Never
 * access the dom nodes yet.
 * 1. Just queue up their id's and the changes needed to be made on them.
 * 2. Clone the entire update tree, swap the real tree with the clone.
 * 3. Now you work with the clone in memory, working your way through the queue
 *    of work to do. The copy you're working on was not clone, so it likely
 *    still has a working .querySelector('#id') engine you can use to retrieve
 *    the dom nodes. If not, before swapping the clone into the dom (step 2)
 *    quickly create a lookup map from the work queue using document.getEle..
 *    After swapping those references will now point to the nodes in the in-
 *    memory copy.
 * 4. Work your way through the queue, making updates as needed in memory.
 *    (use textContent).
 * 5. Swap again.
 *
 * Notes: Step one is actually more complicated - because we need to 'let the
 *  system reach steady state.' Each event handler could perform its own update
 *  then trigger many callbacks - each causing their own updates.
 *  We should begin step two when we've gone through as many cycles as needed.
 * I really hope we can get references to the in memory copy without swapping.
 * Ideally - we'd clone and work on the clone in memory as opposed to
 * performing two swaps.
 * 
 * This should be configurable on a per component basis, because the cost of
 * cloning will only be worth investing in, if we prevent several costly
 * reflows.
 */
_Fax.controlPhysicalDomByNodeOrId = function (elem,
                                              elemId,
                                              nextProps,
                                              lastProps) {

  var cssText = '', style = nextProps.style, propKey,
      styleAttr, styleAttrVal, nextPropsStyleAttrVal, logStyleAttrName,
      nextPosInfo, lastPosInfo, nextClassSet, lastClassSet, currentValue;

  /* here's an interesting optimization. Saves 20% render time in many cases
   * when overprojecting, will hurt the cases where we don't overproject,
   * however those cases aren't of concern.
   * This doesn't check all the attributes, only the most likely to change
   * ones - you can update the api to not allow updates on all other attributes
   * which people should be using styles for (not tag attributes.)
   * Here's where we can apply css3 transforms if they're available - or
   * default to standard absolute positioning if that's the only thing
   * available.
   */
  nextProps = nextProps || {};
  lastProps = lastProps || {};
  nextPosInfo = nextProps.posInfo || {};
  lastPosInfo = lastProps.posInfo || {};
  nextClassSet = nextProps.classSet;
  lastClassSet = lastProps.classSet;
  if ((nextPosInfo &&
        (nextPosInfo.l !== lastPosInfo.l || nextPosInfo.t !== lastPosInfo.t ||
        nextPosInfo.w !== lastPosInfo.w || nextPosInfo.h !== lastPosInfo.h ||
        nextPosInfo.r !== lastPosInfo.r || nextPosInfo.b !== lastPosInfo.b)) ||
      (nextProps.style &&
            JSON.stringify(nextProps.style) !== JSON.stringify(lastProps.style)) ||
      nextProps.dangerouslySetInnerHtml !== lastProps.dangerouslySetInnerHtml ||
      nextProps.content !== lastProps.content ||
      nextProps.src !== lastProps.src ||
      /* Todo: check for 'checked' */
      nextProps.className !== lastProps.className || nextProps.value !== lastProps.value ||
      JSON.stringify(nextClassSet) !== JSON.stringify(lastClassSet)) {

    /* At this point, we know something was changed, may as well invest in
     * fetching the element now. */
    elem = elem || document.getElementById(elemId);
    for (propKey in nextProps) {
      if (!nextProps.hasOwnProperty(propKey)) {
        continue;
      }
      var prop = nextProps[propKey];
      if (_controlUsingSetAttrDomAttrsMap[propKey]) {
        elem.setAttribute(_controlUsingSetAttrDomAttrsMap[propKey], prop);
      } else if (propKey === VALUE_KEY) {
        if (elem.value !== nextProps.value) {
          elem.value = nextProps.value;
        }
      } else if(propKey === CLASS_SET_KEY) {
        elem.className = FaxBrowserUtils.escapeTextForBrowser(_Fax.renderClassSet(prop));
      } else if (_Fax.controlDirectlyDomAttrsMap[propKey]) {
        elem[_Fax.controlDirectlyDomAttrsMap[propKey]] =
            FaxBrowserUtils.escapeTextForBrowser(prop);
      } else if(propKey === STYLE_KEY) {
        cssText += _serializeInlineStyle(prop);
      } else if(propKey === POS_INFO_KEY) {
        cssText += _extractAndSealPosInfoInlineImpl(prop);
      } else if (propKey === CONTENT_KEY) {
        /* http://jsperf.com/setting-node-text :
         * An interesting perf test. However, hopefully never in the propagation
         * of updates do we ever trigger a reflow, so it's not really the best
         * test. I think we just need to do what we observe best for each platform:
         * Some of the optimal strategy is dependent on the nature of the type of
         * updates and reflows on a per component basis. Offline textContent seems
         * to be the clear winner, though. I'll settle for online textContent.
         * The perf test doesn't even account for escaping though. */
        elem.textContent = prop;
      } else if (_Fax.controlDirectlyNonIdempotent[propKey]) {
        currentValue = elem[_Fax.controlDirectlyNonIdempotent[propKey]];
        if (currentValue !== prop) {
          elem[_Fax.controlDirectlyNonIdempotent[propKey]] = prop;
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML_KEY) {
        elem.innerHTML = prop;
      } else if (propKey === INNER_HTML_KEY) {
        throw ERROR_MESSAGES.CANNOT_SET_INNERHTML;
      }
    }
    if (cssText) {
      elem.style.cssText = cssText;
    }
    return elem;
  } else {
    return null;
  }
};

/**
 * Fax.makeDomContainerComponent: Creates a controllable native tag component
 * that has the capabilities of accepting event handlers and dom attributes. In
 * general the properties of a native tag component that is created are as
 * follows:
 * Event handlers currently use top level event delegation, not for reasons
 * typically cited (to group event handlers on several dom elements, but rather
 * to divorce markup generation from controlling the dom. We may also decide to
 * use TLED for the purposes of having a single function control behavior on
 * several elements:
 *   onClick:     fn  (top level event delegation)
 *   onMouseUp:   fn
 *   onMouseDown: fn
 *   onMouseIn:   fn
 *
 * Most dom attributes are readable and controllable, but some such as 'value'
 * are only renderable, and cannot continue to be controlled. There is a
 * standard FWidgets text box that solves that inconsistency at a higher level:
 *   width:       create/controlled tag attribute
 *   height:      create/controlled tag attribute
 *   className:        create/controlled tag attribute
 *   value:       only   controlled tag attribute
 *   (many more):   see controlUsingSetAttrDomAttrsMap/markupDomTagAttrsMap
 *
 * Each native dom tag component accepts a style property:
 *   style: {width , height, .. }
 *
 * All native tag components can contain any amount of child components. The
 * parent of the native tag component should just drop children in under any
 * name they wish in the properties, right along side style and event handlers,
 * so long as that name does not conflict with width/className/onClick etc..  We also
 * allow for a native component to be created with lifeless markup that is
 * always injected into various places in the markup tree. In the past, we've
 * used a convention of requiring that children be dropped in a 'contained'
 * field in the declaration, but this way allows more concise code.
 * ${pre}
 * <tag id='x' ${optionalTagText} >
 *   ${headText}
 *   ...
 *   ${footText}
 * </tag>
 * {$post}
 *
 */
function _makeDomContainerComponent(tag, optionalTagTextPar, pre, post, headText, footText) {
  var optionalTagText =  optionalTagTextPar || '',
      tagOpen = (pre || '') + "<" + tag + optionalTagText + " id='",
      tagClose = (footText || '') + "</" + tag + ">" + (post || ''),
      headTextTagClose = ">" + (headText || '');

  var ProjectingConstructor = function(propsParam) {
    return {
      props: propsParam || this,
      maker: NativeComponentConstructor
    };
  };

  var NativeComponentConstructor = function(initProps) {
    this._rootDomId = null;
    this.props = initProps;
    this.children = {};
  };


  NativeComponentConstructor.prototype._childReconciler = childReconciler;
  NativeComponentConstructor.prototype._childGenerator = childGenerator;

  /**
   * Reregister the event handlers just in case an update happened to something
   * that someone 'closed' in a closure and expected to be updated #todoperf:
   * not sure what can be done. Possibly two-piece cocoa style delegation (a
   * target and a method to invoke from prototype). The reason why we always
   * reregister the handlers, is that someone may have specified a handler that
   * traps some intermediate variable in it's closure and data is out of sync:
   * var stateMember = this.state.stateMember;
   * var b = {
   *   onClick: function() { alert(stateMember); }
   * }.Button()
   * In the projecting api, if someone updates this.state.stateMember, the only
   * way for that handler to always alert the real stateMember is to reproject
   * and retrap the latest value in it's closure. Requiring class method handles
   * gets around this because object (as in OO) are really just 'well
   * understood' closures and can accomplish redirection that is never stale
   * through the 'this' keyword (because that's your only option).
   *
   * #todocontrol: when a updateState happens we refresh everything under the
   * component that reprojects. I've experimented with various ways of detecting
   * which parts of the component tree are dirty and traversing only those
   * paths, but each of those solutions works well in a subset of the cases. The
   * solution is to detect which of these solutions is most performant in any
   * arbitrary situation. To fully detect changes, we must make deep copies
   * after every change.
   *
   * #todoperf: this api:
   * Comp = {
   *   onMyClicked: fun() {...},
   *   project: function() {
   *     return {
   *       onClick: this.onMyClicked
   *     }.Div()
   *   }
   * };
   * This api allows a huge perf opt. If handlers are defined as members of the
   * class, then we don't need to define a new method for all instances
   * Furthermore, we only need to attach a single handler to the top level.  At
   * render time, the *first* time we encounter a handler that is a member of
   * some parent, we can infer that all instances of the parent want to know
   * about click events on children at that path pattern. The substring of the
   * id space from the parent to the child forms an identity for the
   * relationship (though you might need to store class name in order to resolve
   * same name collisions for different types of comps.  We could register a top
   * level event listener on that *relationship*.  When the id of a clicked
   * element contains a substring that is that relationship, we execute
   * handler.call(parent_intance).  The hard part is, while rendering
   * remembering who your parents were, at what id paths, and all of their
   * handlers.  We can consider requiring annotations for classwide top level
   * handlers (when you know it should be used on all instances, by stuffing
   * these in some substructure of the class definition.

   * An alternative approach would be to simply have the native dom container
   * api accept potentially annotated functions themselves: div: { onClick
   * topLevel(this.onMyClicked.annotate) }.Div() Where annotate is more
   * efficient than bind() because it doesn't need a new closure, but rather
   * uses global information about the current component being projected, to
   * register not only the reference to prototyped lambda but along side a
   * single fingerprint of the relationship that can be used to determine the
   * parent instance that should be invoked (x.call(parent) This registration
   * only needs to happen ONCE per child instance and in fact could be destroyed
   * in the class definition (unset) so as not to show up in future object
   * iterations.  Alternatively, you could also have special class member
   * section 'topLevelHandlers' that would automatically annotate themselves.

   * THIS REQURES A GLOBAL REGISTRY OF COMPONENTS BY ID SPACE. SO THAT WE CAN
   * LOOK UP THE COMPONENT INSTANCES BY ID. SUCH A REGISTRY WOULD BE VERY USEFUL
   * FOR CALLING CHILD METHODS -which I've intentionally avoided so far for
   * other reasons. We should also prevent ever referencing your parent. The
   * portion of the api exposed to children is only relative to themselves,
   * whereas the api exposed to the system, is absolute and has no restrictions.
   */
  NativeComponentConstructor.prototype.doControl = function(nextProps) {
    if (!this._rootDomId) { throw ERROR_MESSAGES.CONTROL_WITHOUT_BACKING_DOM; }

    /* #differentThanMultiChildMixins - control parent, props, registerHandlers
     * Lazilly store a reference to the rootDomNode. We won't even take the
     * time to store the reference in the constructor. We only ever store it
     * when we apply our first change to the dom - which may be never - hence
     * the laziness. When we control a dom node by id, it will return the dom
     * node iff it actually applied a change. We'll save it for next time. */
    if (!nextProps._dontControlTopMostDom) {
      this.rootDomNode = _Fax.controlPhysicalDomByNodeOrId(
          this.rootDomNode,
          this._rootDomId,
          nextProps,
          this.props);
    }
    this.props = nextProps;
    if (this.props._dontControlExistingChildren) {
      return;
    }

    if (nextProps.dynamicHandlers) {
      FaxEvent.registerHandlers(this._rootDomId, nextProps.dynamicHandlers);
    }

    /* Ignore all native tag properties, those aren't children. */
    this._childReconciler(
        nextProps,
        Fax.allNativeTagAttributesAndHandlerNames,
        nextProps._onlyControlChildKeys);

  };

  /**
   * NativeComponentConstructor.genMarkup: Performance explanation: If noone has
   * augmented Object.prototype, iterating through object properties is faster,
   * even if you know the range of values that might be found. See
   * http://jsperf.com/obj-vs-arr-iteration . The checks for each member of the
   * props are in order of likeliness to occur: Styles are last because we
   * should put them in css/less anyways.
   * classText-subprojection-handler-string-style

   * #todoie: IE/FF typeof faster chrome instanceOf is faster. We should have
   * custom macros that are completely valid js function calls but detected in
   * our ast parsing and transformed to inline browser type optimized.
   * #todoperf: Object.keys is much faster in Chrome and older safari. Manual
   * iteartion faster in newer safari and Firefox. Custom builds help to
   * explains why Fax components render faster in Firefox, since we use manual
   * iteration over object keys so frequently. However, since we're not just
   * aggregating the keys, but also acting on each one, I would suspect the
   * current approach could be fastest in *any* browser.

   * #todoperf: The code here is already a bit denormalized for sake of
   * performance but we could take it even further by having a custom method for
   * each combination of markup/no-markup, events/no-events
   */
  NativeComponentConstructor.prototype.genMarkup = function(idRoot, doMarkup, doHandlers) {
    var containedIdRoot, newComponent, propKey, prop,
        tagAttrAccum = '', currentDomProps = this.props,
        finalRet = '', cssText =  '', header,
        sawChildren = false, childProjections = {},
        innerMarkup = false, handlerPack;

    header = tagOpen;
    header += idRoot;
    header += "' ";

    this._rootDomId = idRoot;

    /* Handler pack - if all handlers in a single group */
    handlerPack = currentDomProps[DYNAMIC_HANDLERS_KEY];
    if (doHandlers && handlerPack) {
      FaxEvent.registerHandlers(idRoot, prop);
    }

    for (propKey in currentDomProps) {
      if (!currentDomProps.hasOwnProperty(propKey)) { continue; }
      prop = currentDomProps[propKey];
      if (prop === null || typeof prop === 'undefined') { continue; }

      if (doHandlers && FaxEvent.abstractHandlerTypes[propKey]) {
        FaxEvent.registerHandlerByName(idRoot, propKey, prop);
      }

      /* Accumulate these, so that we can make a single call to childGenerator. */
      if (prop.maker) {
        sawChildren = true;
        childProjections[propKey] = prop;
      } else if (doMarkup) {
        if (_markupDomTagAttrsMap[propKey]) {
          tagAttrAccum += _tagDomAttrMarkupFragment(propKey, prop);
        } else if(propKey === CLASS_SET_KEY) {
          tagAttrAccum += "class='";
          tagAttrAccum += _Fax.renderClassSet(prop);
          tagAttrAccum += "'";
        } else if (propKey === STYLE_KEY) {
          cssText += _serializeInlineStyle(prop);
        } else if (propKey === POS_INFO_KEY) {
          cssText += _extractAndSealPosInfoInlineImpl(prop);
        } else if (propKey === CONTENT_KEY) {
          innerMarkup = FaxBrowserUtils.escapeTextForBrowser(prop);
        } else if (propKey === DANGEROUSLY_SET_INNER_HTML_KEY) {
          innerMarkup = prop;
        }
      }
    }

    if (sawChildren) {
      innerMarkup = this._childGenerator(idRoot, childProjections, doMarkup, doHandlers);
    }

    if (doMarkup) {
      finalRet += header;
      finalRet += tagAttrAccum;
      if (cssText) {
        finalRet += " style='";
        finalRet += cssText;
        finalRet += "'";
      }
      finalRet += headTextTagClose;
      if (innerMarkup) {
        finalRet += innerMarkup;
      }
      finalRet += tagClose;
      return finalRet;
    }
  };

  return ProjectingConstructor;
}


/*
 * Copies all Components from a package to namespace for declarative use.
 * Ensures that each member has been transformed into a component constructor,
 * if hasn't already been done.
 */
var _usingInImpl = function(namespace, uiPackages) {
  if (!namespace) {
    _Fax.Error(ERROR_MESSAGES.NAMESPACE_FALSEY);
  }
  var _appendAll = function() {
    var i, uiComponent;
    for (i=0; i < uiPackages.length; i++) {
      var uiPackage = uiPackages[i];
      for (uiComponent in uiPackages[i]) {
        var packageVal = uiPackage[uiComponent];
        if (!uiPackage.hasOwnProperty(uiComponent)) {
          continue;
        }
        /* might already be a constructor. Otherwise it might be a
         * random data blob that is exported as part of the package. */
        if (typeof packageVal === 'function') {
          namespace[uiComponent] = packageVal;
        } else if(packageVal && packageVal.project !== undefined) {
          namespace[uiComponent] = Fax.Componentize(packageVal);
        }
      }
    }
  };

  /*
   * Append now, and then append after the file has populated any of the
   * packages properties in the arguments (for use in callbacks). We only
   * technically need to append the one that was currently being defined at the
   * time of using - but we can't tell which one that is.
   */
  _appendAll();
  _Fax.beforeRendering.push(_appendAll);
};

_Fax.using = function() {
  var uiPackages = [],
      i;
  for (i=0; i < arguments.length; i++) {
    uiPackages.push(arguments[i]);
  }
  var ns;
  if (Fax.populateNamespace) {
      ns = Fax.populateNamespace;
  } else {
      ns = Object.prototype;
  }
  _usingInImpl(ns, uiPackages);
};

var _sure = function(obj, propsArr) {
  var doesntHave = [],
      jj;
  for (jj = propsArr.length - 1; jj >= 0; jj--) {
    if(!obj.hasOwnProperty([propsArr[jj]])) {
      doesntHave.push(propsArr[jj]);
    }
  }
  if (doesntHave.length !== 0) {
    throw ERROR_MESSAGES.PROPERTIES_NOT_THERE + _ser(propsArr);
  }
};


/**
 * Probably better than prototypical extension because we can reason about
 * nullness more gracefully. This version just takes one in the construction
 * because arguments access can be very slow. Though the returned function needs
 * to look at *it's* arguments. For a single value case - where even the
 * returned function expects only one argument - use _curryOnly.
 */
var _curryOne = function(func, val, context) {
  if (!func) {
    return null;
  }
  return function() {
    var newArgs = [val], i;
    for (i = arguments.length - 1; i >= 0; i--) {
      newArgs.push(arguments[i]);
    }
    return func.apply(null, newArgs);
  };
};

var _bindNoArgs = function (func, context) {
  if (!func) {
    return null;
  }
  return function () {
    return func.call(context);
  };
};

/**
 * When the function who's first parameter you are currying accepts only a
 * single argument, and you want to curry it, use this function for performance
 * reasons, as it will never access 'arguments'. It would be an interesting
 * project to detect at static analysis time, calls to F.curry that could be
 * transformed to one of the two optimized versions seen here.
 */
var _curryOnly = function(func, val, context) {
  if (!func) {
    return null;
  }
  return function() {
    return func.call(context || null, val);
  };
};

/**
 * Takes a set of classes in map form, concatenating the keys for which values
 * are '===true' together to form a single class string. Maintains a trailing
 * space at the end so you can easily add additional classes. A nice way to
 * string together class strings when there are several things that determine
 * what should be included. Added support for nesting trees (the owner can pass
 * you a classSet, and you can embed it into the classSet - forming a tree.
 * Eventually we should guarantee some sort of order, but for now we don't.
 * Maybe, the order guarantee should be breadth first.
 *
 * var classString =
 *  Fax.classSet({
 *    ClassOne: true,                  // Will append 'ClassOne'
 *
 *    // Support for the next use case should be deprecated.
 *    userProvidedClass: this.userClass, // Appends this.userClass if it's truthy
 *
 *    disabled: !!this.shouldDisable   // appends 'disabled' iff this.shouldDisable
 *    enabled: !this.shouldDisable     // appends 'enabled' iff !this.shouldDisable
 *  });
 */
_Fax.renderClassSet = function(namedSet) {
  var accum = '',
      nameOfClass;
  for (nameOfClass in namedSet) {
    if (!namedSet.hasOwnProperty(nameOfClass)) {
      continue;
    }
    var val = namedSet[nameOfClass];
    // Intentionally check double equals == true to catch number 1 || true
    if(val == true) {
      accum += nameOfClass;
      accum += ' ';
    } else if(nameOfClass) {
      /* This type of classSet value should be deprecated because it encourages
       * using strings which will not be minifiable.*/
      if (typeof val === 'string') {
        accum += val;
        accum += ' ';
      } else {
        accum += _Fax.renderClassSet(val);
      }
    }
  }
  return accum;
};

/**
 * Fax.extractCssPosInfo - Either gets the posInfo field if it exists, or gets the
 * position looking fields out of the object itself but  does not get both -
 * posInfo having priority.
 */
_Fax.extractCssPosInfo = function (obj) {
  return obj.posInfo || Fax.objSubset(obj, {
    width: true,
    height: true,
    left: true,
    top: true,
    bottom: true,
    right: true,
    zIndex: true,
    position: true
  });
};

/**
 * Fax.extractPosInfo - Either gets the posInfo field if it exists, or gets the
 * position looking fields out of the object itself but does not get both -
 * posInfo having priority. Assumes exists within an absolutely positioned
 * element and uses shorthands as higher level components should.
 */
_Fax.extractPosInfo = function (obj) {
  return obj.posInfo || Fax.objSubset(obj, {
    w: true, h: true, l: true, t: true, b: true, r: true, z: true
  });
};

/**
 * Takes standard higher level position info and turns it into css position info
 * - again assuming existing in an absolutely positioned element.
 */
_Fax.sealPosInfo = function(posInfo) {
  var ret = {};
  if (posInfo.w === 0 || posInfo.w) {
    ret.width = posInfo.w.charAt ? posInfo.w : (posInfo.w + 'px');
  }
  if (posInfo.h === 0 || posInfo.h) {
    ret.height = posInfo.h.charAt ? posInfo.h : (posInfo.h + 'px');
  }
  if (posInfo.l === 0 || posInfo.l) {
    ret.left = posInfo.l.charAt ? posInfo.l : (posInfo.l + 'px');
  }
  if (posInfo.t === 0 || posInfo.t) {
    ret.top = posInfo.t.charAt ? posInfo.t : (posInfo.t + 'px');
  }
  if (posInfo.b === 0 || posInfo.b) {
    ret.bottom = posInfo.b.charAt ? posInfo.b : (posInfo.b + 'px');
  }
  if (posInfo.r === 0 || posInfo.r) {
    ret.right = posInfo.r.charAt ? posInfo.r : (posInfo.r + 'px');
  }
  if (posInfo.z === 0 || posInfo.z) {
    ret.zIndex = posInfo.z;
  }
  return ret;
};


/**
 * Extracts position info - which may be numeric - we should make a version
 * for when the amounts are known to be absolute numbers.
 */
_Fax.extractAndSealPosInfo = function(obj) {
  if(!obj) {
    return {};
  }
  var ret = {};
  if (obj.w === 0 || obj.w) {
    ret.width = (obj.w.charAt ? obj.w : (obj.w + 'px'));
  }
  if (obj.h === 0 || obj.h) {
    ret.height = (obj.h.charAt ? obj.h : (obj.h + 'px'));
  }
  if (obj.l === 0 || obj.l) {
    ret.left = (obj.l.charAt ? obj.l : (obj.l + 'px'));
  }
  if (obj.t === 0 || obj.t) {
    ret.top = (obj.t.charAt ? obj.t : (obj.t + 'px'));
  }
  if (obj.b === 0 || obj.b) {
    ret.bottom = (obj.b.charAt ? obj.b : (obj.b + 'px'));
  }
  if (obj.r === 0 || obj.r) {
    ret.right = (obj.r.charAt ? obj.r : (obj.r + 'px'));
  }
  if (obj.z === 0 || obj.z) {
    ret.zIndex = obj.z;
  }
  return ret;
};

/**
 * Same as above but generates a style string for use with cssText or
 * inline style attributes. Should make a version for when we know the
 * values are numeric.
 */
var _extractAndSealPosInfoInline = function(obj) {
  if(!obj) { return ''; }
  var ret = '', w = obj.w, h = obj.h, l = obj.l,
      t = obj.t, b = obj.b, r = obj.r, z = obj.z;

  if (w === 0 || w) {
    ret += 'width:' + (w.charAt ? (w + ';') : (w + 'px;'));
  }
  if (h === 0 || h) {
    ret += 'height:' + (h.charAt ? (h + ';') : (h + 'px;'));
  }
  if (l === 0 || l) {
    ret += 'left:' + (l.charAt ? (l + ';') : (l + 'px;'));
  }
  if (t === 0 || t) {
    ret += 'top:'  + (t.charAt ? (t + ';') : (t + 'px;'));
  } 
  if (b === 0 || b) {
    ret += 'bottom:' + (b.charAt ? (b + ';') : (b + 'px;'));
  }
  if (r === 0 || r) {
    ret += 'right:' + (r.charAt ? (r + ';')  : (r + 'px;'));
  }
  if (z === 0 || z) {
    ret += 'z-index:' + z + ';';
  }
  ret += 'position:absolute';
  return ret;
};


/**
 * To have this be overridden with an optimal implementation, call
 * setBrowserOptimalPositionComputation.
 */
var _extractAndSealPosInfoInlineImpl = _extractAndSealPosInfoInline;

var webkitVendorPrefix = 'left:0px; top:0px;-webkit-transform:translate3d(';
var webkitvendorSuffixForString = ',0);';
var webkitvendorSuffixForNum = 'px,0);';
var webkitvendorSuffixForNothing = '0px,0);';

var mozVendorPrefix = 'left:0px; top:0px;-moz-transform: translate(';
var mozVendorSuffixForString = ');';
var mozVendorSuffixForNum = 'px);';
var mozVendorSuffixForNothing = '0);';

var ieVendorPrefix = 'left:0px; top:0px;-ie-transform: translate(';
var ieVendorSuffixForString = mozVendorSuffixForString;
var ieVendorSuffixForNum = mozVendorSuffixForNum;
var ieVendorSuffixForNothing = mozVendorSuffixForNothing;

var _makeExtractAndSealerInlineUsingVendorTransform =
    function(prefix, suffixForString, suffixForNum, suffixForNothing) {

  /**
   * Optimized for css engines that support translations. An absolutely positioned
   * element with a (top, left, width, height) is equivalent to an absolutely
   * positioned element with (width, height, translate3d(left, top, 0)). When a
   * position info includes a right value, things are more complicated.
   * t:1, l:1, w:20, h:20 => transform(1,1), w:20, h:20
   *
   * t:1, l:1, r:10, b:10 => transform(1,1), r: 10+1, b:10+1
   *
   * see: http://jsfiddle.net/3HzTC/1/
   *
   * We need to trick certain webkit implementations into kicking the computations
   * to the GPU by using a 3d transform even though this is only a 2d operation.
   */
  return function(obj) {
    if(!obj) { return ''; }
    var ret = '', w = obj.w, h = obj.h, l = obj.l,
        t = obj.t, b = obj.b, r = obj.r, z = obj.z;

    /** I with we didn't have to do these checks. Oh well, in the event that we're
     * using css3 to position, the javascript isn't going to likely be our
     * bottleneck anyways. Going forward, we should use posInfo: to represent
     * absolutely positioned coords such that no boundary is 'auto'
     */
    if (l === 'auto' || r === 'auto' || b === 'auto' || t === 'auto') {
      return _extractAndSealPosInfoInline(obj);
    }

    if (w === 0 || w) {
      ret += 'width:';
      ret += w;
      if (w.charAt) {
        ret += ';';
      } else {
        ret += 'px;';
      }
    }
    if (h === 0 || h) {
      ret += 'height:';
      ret += h;
      if (h.charAt) {
        ret += ';';
      } else {
        ret += 'px;';
      }
    }
    // Updates if the browser supports transforms are so much faster
    // than merely absolute positioning.
    if (l === 0 || l || t === 0 || t) {
      ret += prefix;
      if (l === 0 || l) {
        ret += l;
        if(l.charAt) {
          ret += ',';
        } else {
          ret += 'px,';
        }
      } else {
        ret+= '0px,';
      }
      if (t === 0 || t) {
        ret += t;
        if(t.charAt) {
          ret += suffixForString;
        } else {
          ret += suffixForNum;
        }
      } else {
        ret+= suffixForNothing;
      }
    }

    /**
     * We must add the height and left values to bottom and top respectively
     * because the left and top values are going to act as translate. Can't
     * help you out with percentages, though.
     */
    if (b === 0 || b) {
      if (t === 0 || (t && !t.charAt)) {
        ret += 'bottom:';
        if(b.charAt) {
          ret += b;
          ret += ';';
        } else {
          ret += (b + t);
          ret += 'px;';
        }
      } else {
        ret += 'bottom:';
        ret += b;
        if(b.charAt) {
          ret += ';';
        } else {
          ret += 'px;';
        }
      }
    }
    if (r === 0 || r) {
      if (l === 0 || (l && !l.charAt)) {
        ret += 'right:';
        if(r.charAt) {
          ret += r;
          ret += ';';
        } else {
          ret += (r+l);
          ret += 'px;';
        }
      } else {
        ret += 'right:';
        ret += r;
        if(r.charAt) {
          ret += ';';
        } else {
          ret += 'px;';
        }
      }
    }
    if (z === 0 || z) {
      ret += 'z-index:';
      ret += z;
      ret += ';';
    }
    ret += 'position:absolute;';
    return ret;
  };


};

var _extractAndSealPosInfoInlineUsingTranslateWebkit =
    _makeExtractAndSealerInlineUsingVendorTransform(webkitVendorPrefix,
        webkitvendorSuffixForString, webkitvendorSuffixForNum,
        webkitvendorSuffixForNothing);

var _extractAndSealPosInfoInlineUsingTranslateMoz =
    _makeExtractAndSealerInlineUsingVendorTransform(mozVendorPrefix,
        mozVendorSuffixForString, mozVendorSuffixForNum,
        mozVendorSuffixForNothing);

var _extractAndSealPosInfoInlineUsingTranslateIe =
    _makeExtractAndSealerInlineUsingVendorTransform(ieVendorPrefix,
        ieVendorSuffixForString, ieVendorSuffixForNum,
        ieVendorSuffixForNothing);

/**
 * Will not work with 'auto', should remove support for auto everywhere - This
 * utility is flexible enough to preserve autos when they're already there -
 * just don't include a delta for the field you want to keep default 'auto'
 * behavior.
 *
 * Note that if an element is relatively positioned with a left and right
 * value, this won't do what you want (similarly to transforms). We handle
 * transforms because we know that we need to work around a relatively
 * positioned system, whereas when using this function, we're not sure if the
 * object at hand is using absolute or relatively positioned. We default to
 * absolute.
 *
 * Summary: if you have a parent with an abs child and a rel child, using this
 * function to offset the rel child with respect to the abs child's posInfo
 * will not act strangly when that posInfo has both a right and a left.  You
 * need to manually compensate for that situation (so pass in forRel=true)
 * Correction: When position: 'relative' is used, you cannot seem to compensate
 * at all for right, right has no effect, because the element will first be
 * statically positioned, then the top and left values only will be used to
 * offset it. The forRel may still be useful when doing 3d transforms on abs
 * positioned elements.
 *
 * Todo: Let the transform code use this.
 *
 * In deltas:
 *   omitted: No field in result.
 *   Included and delta value zero:
 *       If posInfo value is present, that value is coppied over to the result.
 *       If posInfo value is not present, no value is coppied to result.
 */
var _posOffset = function (posInfo, deltas, forRel) {
  if (!posInfo && deltas) {
    return deltas; // vulnerable to mutation bugs - be careful.
  }
  if (!deltas && posInfo) {
    return posInfo;
  }
  if (!deltas && !posInfo) {
    return deltas;
  }
  var ret = {};
  var addlRight = 0;
  var addlBot = 0;
  if (deltas.hasOwnProperty(L_KEY)) {
    if (!deltas.l /* falsey */ ) {
      if (posInfo.hasOwnProperty(L_KEY)) {
        ret.l = posInfo.l;
      }
    } else {
      ret.l = (deltas.l + (posInfo.l || 0));
    }
    addlRight = forRel && ret.l || 0;
  }
  if (deltas.hasOwnProperty(R_KEY)) {
    if (!deltas.r /* falsey */ ) {
      if (posInfo.hasOwnProperty(R_KEY)) {
        ret.r = posInfo.r + addlRight;
      }
    } else {
      ret.r = (deltas.r + (posInfo.r || 0)) + addlRight;
    }
  }
  if (deltas.hasOwnProperty(T_KEY)) {
    if (!deltas.t /* falsey */ ) {
      if (posInfo.hasOwnProperty(T_KEY)) {
        ret.t = posInfo.t;
      }
    } else {
      ret.t = (deltas.t + (posInfo.t || 0));
    }
    addlBot = forRel && ret.t || 0;
  }
  if (deltas.hasOwnProperty(B_KEY)) {
    if (!deltas.b /* falsey */ ) {
      if (posInfo.hasOwnProperty(B_KEY)) {
        ret.b = posInfo.b + addlBot;
      }
    } else {
      ret.b = (deltas.b + (posInfo.b || 0)) + addlBot;
    }
  }
  if (deltas.hasOwnProperty(W_KEY)) {
    if (!deltas.w /* falsey */ ) {
      if (posInfo.hasOwnProperty(W_KEY)) {
        ret.w = posInfo.w;
      }
    } else {
      ret.w = (deltas.w + (posInfo.w || 0));
    }
  }
  if (deltas.hasOwnProperty(H_KEY)) {
    if (!deltas.h /* falsey */ ) {
      if (posInfo.hasOwnProperty(H_KEY)) {
        ret.h = posInfo.h;
      }
    } else {
      ret.h = (deltas.h + (posInfo.h || 0));
    }
  }
  return ret;
};

/**
 * If a pos info is provided it will offset it, otherwise return the falseyness.
 */
var _posOffsetIfPosInfo = function (posInfo, deltas, forRel) {
  return posInfo ? _posOffset(posInfo, deltas, forRel) : posInfo;
};

/**
 * Before the initial render, call this function to ensure that we compute
 * position information in a way that performs best.
 */
var _setBrowserOptimalPositionComputation = function() {
  _extractAndSealPosInfoInlineImpl =
      FEnv.browserInfo.browser === 'Chrome' || FEnv.browserInfo.browser === 'Safari' ?
      _extractAndSealPosInfoInlineUsingTranslateWebkit :
  FEnv.browserInfo.browser === 'Firefox' ? _extractAndSealPosInfoInlineUsingTranslateMoz :
  FEnv.browserInfo.browser === 'MSIE' &&
     (FEnv.browserInfo.version === '9.0' || FEnv.browserInfo.version === '10.0') ?
      _extractAndSealPosInfoInlineUsingTranslateIe :
  _extractAndSealPosInfoInline;
};

/* Fetching the scroll values before rendering results in something like a 20%
 * increase in rendering time - since the rendering blocks on calculation of
 * the layout. We could include this call as an option for top level rendering
 * but most won't need fresh scroll values on render (however viewport values
 * are very important for most apps, but they don't seem to take as long.)
 * FEnv.refreshAuthoritativeScrollValues(); */
_Fax.preRenderingAnything = function(mountAt, renderOptions) {
  var useTouchEventsInstead = renderOptions.useTouchEventsInstead;
  FEnv.refreshAuthoritativeViewportValues();
  FaxEvent.ensureListening(mountAt, useTouchEventsInstead);
  FEnv.ensureBrowserDetected();
  _setBrowserOptimalPositionComputation();
};
 

_Fax.map = function(arr, fun, context) {
  var i, res = [];
  if (!arr) {
    return arr;
  }
  for (i = 0; i < arr.length; i = i + 1) {
    res[i] = fun.call(context || this, arr[i], i);
  }
  return res;
};

_Fax.arrToObj = function(arr, keyPrefixParam) {
  var i, ret = {}, keyPrefix = keyPrefixParam || 'key';
  if(!arr) {
    return arr;
  }
  for(i=0; i < arr.length; i++) {
    ret['' + keyPrefix + i] = arr[i];
  }
  return ret;
};

_Fax.mapSlice = function(arr, fun, start, length, context) {
  var i, res = [], end = start + length - 1, arrLen = arr && arr.length;
  if (!arr) {
    return arr;
  }
  for (i = start; i <= end && i < arrLen; i = i + 1) {
    res[i-start] = fun.call(context || this, arr[i], i - start);
  }
  return res;
};

/**
 * Like mapSlice, but informs the callback of each elements position in the
 * original array (as opposed to its position in the slice)
 */
_Fax.mapRange = function(arr, fun, start, length, context) {
  var i, res = [], end = start + length - 1, arrLen = arr && arr.length;
  if (!arr) {
    return arr;
  }
  for (i = start; i <= end && i < arrLen; i = i + 1) {
    res[i-start] = fun.call(context || this, arr[i], i);
  }
  return res;
};

/**
 * Selects a subset of arr preserving order, calling the mapper for each as if
 * that subset is a new array, "reordering". In other words treats the selected
 * indices as a new subsequence of the original array.
 */
_Fax.mapSubSequence = function(arr, indicesArr, fun, context) {
  var i, res = [], len = indicesArr.length;
  for (i=0; i < len; i=i+1) {
    res[i] = fun.call(context || this, arr[indicesArr[i]], i);
  }
  return res;
};

/**
 * Selects a subset of arr preserving order, calling the mapper for each as if
 * but preserving the original specific indices - not reordering them.
 */
_Fax.mapIndices = function(arr, indicesArr, fun, context) {
  var i, res = [];
  for (i=0; i < indicesArr.length; i=i+1) {
    res[i] = fun.call(context || this, arr[indicesArr[i]], indicesArr[i]);
  }
  return res;
};



/* should just use underscore */
_Fax.reduce = function(arr, fun, init, context) {
  return arr.reduce(fun, init, context);
};

/**
 * Fax.objMapFilter:
 * Same as objMap, but filters out any undef result of callback invocation. The
 * returned object won't even have keys for keys that the callback returns
 * undefined.  Note, you *must* return undefined, to indicate that the key
 * should have no presence in the final object and not false/null. Accepts a
 * prefilter as well, indicating a map (keys) to avoid invoking the callback
 * for.
 */
var _objMapFilter = function (obj, fun, preFilter) {
  var mapped, key;
  if (!obj) {
    return obj;
  }
  var ret = {};
  for (key in obj) {
    if (!obj.hasOwnProperty(key) || preFilter && preFilter[key]) {
      continue;
    }
    mapped = fun(key, obj[key]);
    if (mapped !== undefined) {
      ret[key] = mapped;
    }
  }
  return ret;
};

function _arrPull(arr, key) {
  var q, res = [];
  if (!arr) {
    return arr;
  }
  for (q = 0; q < arr.length; q = q + 1) {
    res[q] = arr[q][key];
  }
  return res;
}
function _arrPullJoin(arr, key) {
  var q, res = [];
  if (!arr) {
    return arr;
  }
  for (q = 0; q < arr.length; q = q + 1) {
    res = res.concat(arr[q][key]);
  }
  return res;
}

/* Returns an object map of the form: valueOfByKey => [items where byKey equals
 * valueOfByKey]. Note, if the value in byKey for any item is an object, it
 * will be automatically stringified by the system since we're creating a
 * 'JSON' style map as the return value. A more detailed (and slower)
 * implementation would map categorize by structural value. We could create a
 * similar function that allows us to 'tag' objects, allowing an item to exist
 * in more than one category. Will filter out objects that are null or
 * undefined. All objects that have nothing for that key will be categorized by
 * the 'undefined' category. */
function _arrCategorize(arr, byKey) {
  var i, item, ret = {};
  if (!arr) {
    return {};
  }
  var categoryArr;
  for (i = 0; i < arr.length; i = i + 1) {
    item = arr[i];
    if (item !== undefined && item !== null) {
      if (!ret[item[byKey]]) {
        ret[item[byKey]] = [];
      }
      ret[item[byKey]].push(item);
    }
  }
  return ret;
}


module.exports = Fax = {
  _abstractEventListenersById : FaxEvent.abstractEventListenersById,
  curryOne: _curryOne,
  bindNoArgs: _bindNoArgs,
  curryOnly: _curryOnly,
  MakeComponentClass: _Fax.MakeComponentClass,
  Componentize: _Fax.Componentize,
  ComponentizeAll: _Fax.ComponentizeAll,
  forceClientRendering: true,
  renderAt: _Fax.renderAt,
  renderTopLevelComponentAt: _Fax.renderTopLevelComponentAt,
  maybeInvoke: _Fax.maybeInvoke,
  makeDomContainerComponent: _makeDomContainerComponent,
  allTruthy: _Fax.allTruthy,
  crossProduct: FaxBrowserUtils.crossProduct,
  extractCssPosInfo: _Fax.extractCssPosInfo,
  extractPosInfo: _Fax.extractPosInfo,
  sealPosInfo: _Fax.sealPosInfo,
  extractAndSealPosInfo: _Fax.extractAndSealPosInfo,
  newPosInfoRelativeTo: _Fax.newPosInfoRelativeTo,
  objMap: _Fax.objMap,
  oMap: _Fax.objMap,
  arrPull: _arrPull,
  arrPullJoin: _arrPullJoin,
  arrCategorize: _arrCategorize,
  map: _Fax.map,
  mapRange: _Fax.mapRange,
  mapSlice: _Fax.mapSlice,
  mapSubSequence: _Fax.mapSubSequence,
  mapIndices: _Fax.mapIndices,
  arrToObj: _Fax.arrToObj,
  reduce: _Fax.reduce,
  objMapToArray: _Fax.objMapToArray,
  objMapFilter: _objMapFilter,
  arrMapToObj: _Fax.arrMapToObj,
  arrMapToObjAutoKey: _Fax.arrMapToObjAutoKey,
  keys: _Fax.keys,
  keyCount: _Fax.keyCount,
  objSubset: _Fax.objSubset,
  objExclusion: _Fax.objExclusion,
  using: _Fax.using,
  populateNamespace: null,
  copyProps: _Fax.copyProps,
  shallowClone: _Fax.shallowClone,
  sure: _sure,
  STRETCH: {top: 0, left: 0, right: 0, bottom: 0, position: 'absolute'},
  appendMarkup: _appendMarkup,
  singleDomNodeFromMarkup: _singleDomNodeFromMarkup,
  insertNodeAfterNode: _insertNodeAfterNode,
  renderClassSet: _Fax.renderClassSet,
  merge: _Fax.merge,
  mergeThree: _Fax.mergeThree,
  mergeDeep: _Fax.mergeDeep,
  mergeStuff: _Fax.mergeStuff,
  multiComponentMixins: _Fax.multiComponentMixins,
  orderedComponentMixins: _Fax.orderedComponentMixins,
  multiDynamicComponentMixins: _Fax.multiDynamicComponentMixins,
  getViewportDims: FaxBrowserUtils.getViewportDims,
  serializeInlineStyle: _serializeInlineStyle,
  clone: _clone,
  POS_KEYS: {l:true, h:true, w:true, r:true, b:true, t:true },
  POS_CLASS_KEYS: {l:true, h:true, w:true, r:true, b:true, t:true, classSet: true },
  allNativeTagAtrributes: _allNativeTagAttributes,
  allNativeTagAttributesAndHandlerNames: _allNativeTagAttributesAndHandlerNames,
  escapeTextForBrowser: FaxBrowserUtils.escapeTextForBrowser,
  clearBeforeRenderingQueue: _Fax.clearBeforeRenderingQueue,
  renderingStrategies: _Fax.renderingStrategies,
  _onlyGenMarkupOnProjection: _Fax._onlyGenMarkupOnProjection,
  getTotalInstantiationTime: function() { return _Fax.totalInstantiationTime; },
  releaseMemoryReferences: _Fax.releaseMemoryReferences,
  indexOfStruct: _Fax.indexOfStruct,
  structExists: _Fax.structExists,
  keyOf: keyOf,
  keyMirror: keyMirror,
  posOffset: _posOffset,
  posOffsetIfPosInfo: _posOffsetIfPosInfo
};
/**
 * Members used to work around object key minification are the only entry
 * points that need to avoid object key minification.
 */
Fax['keyOf'] = keyOf;
Fax['minifiedKeyTest'] = minifiedKeyTest;
Fax['renderTopLevelComponentAt'] = Fax.renderTopLevelComponentAt;

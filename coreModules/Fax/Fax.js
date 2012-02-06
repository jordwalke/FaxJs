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
    FEnv = require('./FEnv'),
    FaxDomAttributes = require('./FaxDomAttributes'),
    FaxUtils = require('./FaxUtils'),
    FaxComponentization = require('./FaxComponentization');

/* Forward declarations. */
var Fax;

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
  NAMESPACE_FALSEY: "Namespace is falsey wtf!"
};



/**
 * We need to flatten all of these package records. Either as an uglify
 * processor stage, or in the code itself. Accessing data through objects is 20%
 * slower in Safari, and 12% slower in IE8.
 * http://jsperf.com/accessing-object-method/2/edits
 */
var _Fax = {
  componentCurrentlyProjectingLock: null,
  beforeRendering: [],
  totalInstantiationTime: 0
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

function assert(val, errorMsg) {
  if(!val) {
    throw errorMsg || ERROR_MESSAGES.FAILED_ASSERTION;
  }
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

var releaseMemoryReferences = function () {
  FaxEvent.releaseMemoryReferences(FaxComponentization.idPrefixesAwaitingClearing);
  FaxComponentization.idPrefixesAwaitingClearing = {};
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

/* Fetching the scroll values before rendering results in something like a 20%
 * increase in rendering time - since the rendering blocks on calculation of
 * the layout. We could include this call as an option for top level rendering
 * but most won't need fresh scroll values on render (however viewport values
 * are very important for most apps, but they don't seem to take as long.)
 * FEnv.refreshAuthoritativeScrollValues(); */
function preRenderingAnything(mountAt, renderOptions) {
  var useTouchEventsInstead = renderOptions.useTouchEventsInstead;
  FEnv.refreshAuthoritativeViewportValues();
  FaxEvent.ensureListening(mountAt, useTouchEventsInstead);
  FEnv.ensureBrowserDetected();
  FaxComponentization.setBrowserOptimalPositionComputation(
    renderOptions.useTransformPositioning);
}

/**
 * Renders a projection at a particular dom node, and returns the component
 * instance that was derived from the projection. In summary here's the flow of
 * data:
 * (ProjectingConstructor(Props))=>Projection
 * Render(Projection)=>ComponentInstance mounted on the dom somewhere.
 * Changes to the component instance will be reflected on the DOM automatically.
 */
function renderAt(projection, id, renderOptionsParam) {
  var renderOptions = renderOptionsParam || {},
      mountAt = document.getElementById(id),
      renderingStrategy = renderOptions.renderingStrategy ||
                          _Fax.renderingStrategies.standard;
      
  _Fax.clearBeforeRenderingQueue();
  preRenderingAnything(mountAt, renderOptions);

  
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
}


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
function renderTopLevelComponentAt(ProjectionOrProjectionConstructor,
                                          renderOptions) {
  var mountAtId = renderOptions && (renderOptions.charAt ? renderOptions :
                      renderOptions.mountAtId);
  var dims = FaxBrowserUtils.getViewportDims();
  var cookies = FaxBrowserUtils.readCookie() || {};
  assert(mountAtId, ERROR_MESSAGES.NO_TOP_LEVEL_ID);
  assert(ProjectionOrProjectionConstructor, ERROR_MESSAGES.MUST_SPECIFY_TOP_COMP);

  var baseTopLevelProps = {
    chromeHeight : dims.viewportHeight,
    chromeWidth : dims.viewportWidth,
    cookies: cookies
  };

  /* The caller did not actually call the projection constructor - they just gave
   * us a reference to that projection constructor - we'll do it for them. */
  var callerPassedInProjection = ProjectionOrProjectionConstructor.maker;
  var topLevelCreateData = FaxUtils.mergeStuff(
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
      renderAt(topLevelProjection, mountAtId, renderOptions);

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
        FaxUtils.mergeStuff(updateProps, renderedComponentInstance.props));
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
      FaxUtils.mergeStuff(updateProps, renderedComponentInstance.props));
  };

  return renderedComponentInstance;
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
        } else if(packageVal && packageVal.structure !== undefined) {
          namespace[uiComponent] = FaxComponentization.Componentize(packageVal);
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

var using = function() {
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

 
module.exports = Fax = {
  _abstractEventListenersById : FaxEvent.abstractEventListenersById,
  MakeComponentClass: FaxComponentization.MakeComponentClass,
  Componentize: FaxComponentization.Componentize,
  ComponentizeAll: FaxComponentization.ComponentizeAll,
  forceClientRendering: true,
  renderAt: renderAt,
  crossProduct: FaxBrowserUtils.crossProduct,
  using: using,
  populateNamespace: null,
  STRETCH: {top: 0, left: 0, right: 0, bottom: 0, position: 'absolute'},
  appendMarkup: _appendMarkup,
  getViewportDims: FaxBrowserUtils.getViewportDims,
  clearBeforeRenderingQueue: _Fax.clearBeforeRenderingQueue,
  renderingStrategies: _Fax.renderingStrategies,
  _onlyGenMarkupOnProjection: _Fax._onlyGenMarkupOnProjection,
  getTotalInstantiationTime: function() { return _Fax.totalInstantiationTime; },
  releaseMemoryReferences: releaseMemoryReferences,

  /** FaxUtils reexport */
  mergeStuff: FaxUtils.mergeStuff,
  curryOne: FaxUtils.curryOne,
  bindNoArgs: FaxUtils.bindNoArgs,
  curryOnly: FaxUtils.curryOnly,
  maybeInvoke: FaxUtils.maybeInvoke,
  objMap: FaxUtils.objMap,
  oMap: FaxUtils.objMap,
  arrPull: FaxUtils.arrPull,
  arrPullJoin: FaxUtils.arrPullJoin,
  arrCategorize: FaxUtils.arrCategorize,
  map: FaxUtils.map,
  mapRange: FaxUtils.mapRange,
  mapSlice: FaxUtils.mapSlice,
  mapSubSequence: FaxUtils.mapSubSequence,
  mapIndices: FaxUtils.mapIndices,
  arrToObj: FaxUtils.arrToObj,
  reduce: FaxUtils.reduce,
  objMapToArray: FaxUtils.objMapToArray,
  objMapFilter: FaxUtils.objMapFilter,
  arrMapToObj: FaxUtils.arrMapToObj,
  arrMapToObjAutoKey: FaxUtils.arrMapToObjAutoKey,
  keys: FaxUtils.keys,
  keyCount: FaxUtils.keyCount,
  objSubset: FaxUtils.objSubset,
  objExclusion: FaxUtils.objExclusion,
  copyProps: FaxUtils.copyProps,
  shallowClone: FaxUtils.shallowClone,
  merge: FaxUtils.merge,
  mergeThree: FaxUtils.mergeThree,
  mergeDeep: FaxUtils.mergeDeep,
  clone: FaxUtils.clone,
  indexOfStruct: FaxUtils.indexOfStruct,
  structExists: FaxUtils.structExists,
  keyMirror: FaxUtils.keyMirror,
  keyOf: FaxUtils.keyOf,
  renderTopLevelComponentAt: renderTopLevelComponentAt,

  /** FaxDomAttributes reexport */
  posOffset: FaxDomAttributes.posOffset,
  posOffsetIfPosInfo: FaxDomAttributes.posOffsetIfPosInfo,
  serializeInlineStyle: FaxDomAttributes.serializeInlineStyle,

  /** Allow access of FaxComponentization through export. */
  FaxComponentization: FaxComponentization
};
/**
 * Members used to work around object key minification are the only entry
 * points that need to avoid object key minification.
 */
Fax['keyOf'] = FaxUtils.keyOf;

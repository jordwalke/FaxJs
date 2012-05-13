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
 * Fax.js - core module for the FaxJs ui system.  Exposes most of the
 * functionality needed in order to create javascript applications. By
 * convention, call the exported module 'F'.
 *
 * var F = require('Fax');
 *
 */
var FBrowserUtils = require('./FBrowserUtils');
var FEvent = require('./FEvent');
var FEnv = require('./FEnv');
var FErrors = require('./FErrors');
var FDomAttributes = require('./FDomAttributes');
var FDomTraversal = require('./FDomTraversal');
var FUtils = require('./FUtils');
var FStructuredComponent = require('./FStructuredComponent');
var FDomUtils = require('./FDomUtils');
var FDomGeneration = require('./FDomGeneration');
var FDomMutation = require('./FDomMutation');

/* Forward declaration. */
var Fax;


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

var renderingStrategies = {
  standard: 'S',
  twoPassInteractionOptimized: 'TPVO',
  onlyInstantiate: 'OI',
  onlyMarkup: 'OM'
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
  FErrors.throwIf(!val, FErrors.FAILED_ASSERTION);
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

_Fax.clearBeforeRenderingQueue = function() {
  var i;
  if (_Fax.beforeRendering.length) {
    for (i = _Fax.beforeRendering.length - 1; i >= 0; i--) {
      _Fax.beforeRendering[i]();
    }
  }
};

/**
 * Merely used to create a nicer form of instantiation when querying an AST.
 * Carries with it a definitive signal that this is a deferred construction.
 * This is for auto-injected performance AST transformations - the name is not
 * important.
 */
_Fax._onlyGenMarkupOnProjection = function(instance, _rootDomId) {
  return instance.genMarkup(_rootDomId, true, false);
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
  FEvent.ensureListening(mountAt, useTouchEventsInstead);
  FEnv.ensureBrowserDetected();
  FDomMutation.setBrowserOptimalPositionComputation(
    renderOptions.useTransformPositioning);
  FDomGeneration.setBrowserOptimalPositionComputation(
    renderOptions.useTransformPositioning);
}

/**
 * @renderAt: Renders a reactive component instance at a particular dom node id,
 * and returns the instance.
 */
function renderAt(componentInstance, id, renderOptionsParam) {
  var renderOptions = renderOptionsParam || {};
  var mountAt = document.getElementById(id);
  var renderingStrategy = renderOptions.renderingStrategy ||
                          renderingStrategies.standard;

  _Fax.clearBeforeRenderingQueue();
  preRenderingAnything(mountAt, renderOptions);

  /*
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
      shouldGenMarkupFirstPass =
          renderingStrategy !== renderingStrategies.onlyInstantiate,
      shouldRegHandlersFirstPass =
          renderingStrategy === renderingStrategies.standard ||
          renderingStrategy === renderingStrategies.onlyInstantiate,
      markup = componentInstance.genMarkup(
          '.top', shouldGenMarkupFirstPass, shouldRegHandlersFirstPass);

  _Fax.totalInstantiationTime += ((new Date()).getTime() - start);

  /*
   * In some browsers, you'd be better off *not* removing the element before
   * setting the innerHTML - surprising - as much as a 20% difference in total
   * rendering time! Todo: Make this configurable in the renderOptions.
   */
  parent.removeChild(mountAt);
  mountAt.innerHTML = markup;
  if(nextSibling) {
    parent.insertBefore(mountAt,nextSibling);
  } else {
    parent.appendChild(mountAt);
  }

  /*
   * If we are performing an optimized rendering, then the first pass would have
   * generated the markup and dumped it into the DOM. In that case we still need
   * event handlers attached to the top level, and objects properly allocated.
   * The setTimeout might not make a difference - but I could imagine some
   * browsers waiting until the 'next' event loop to actually display the
   * complete content - and we wouldn't want to block that. No harm deferring
   * either way.
   */
  if (renderingStrategy === renderingStrategies.twoPassInteractionOptimized) {
    setTimeout(function() {
        componentInstance.genMarkup('.top', false, true);
      }, 10
    );
  }

  return componentInstance;
}


/**
 * Simple utility method that renders a new instance of a component (as
 * indicated by the constructor reference passed as first arg) at some id on the
 * dom. This is different than @renderAt, because it 'wires in' some global
 * signals as properties of that component instance. Meaning, you can imaging
 * the browser itself streaming props into your component instance.  This means
 * that your component can expect top level browser attributes such as browser
 * dimensions, cookies and can expect to be restructured/reconciled/re-rendered
 * when these things change. Make your main application component the top level
 * component.  We're careful not to read the viewport dims unless we know the
 * window actually changed, so as not to trigger a reflow needlessly.  You may
 * want to extend/mimic this process for data from the server, so that you can
 * write components that accept props that are the latest "server truth".
 */
function renderTopLevelComponentAt(instanceOrConstructor,
                                   renderOptions) {
  var mountAtId = renderOptions && (renderOptions.charAt ? renderOptions :
                      renderOptions.mountAtId);
  var dims = FBrowserUtils.getViewportDims();
  var cookies = FBrowserUtils.readCookie() || {};
  assert(mountAtId, FErrors.NO_TOP_LEVEL_ID);
  assert(instanceOrConstructor, FErrors.MUST_SPECIFY_TOP_COMP);

  var baseTopLevelProps = {
    chromeHeight : dims.viewportHeight,
    chromeWidth : dims.viewportWidth,
    cookies: cookies
  };

  /*
   * The caller did not actually instantiate a reactive component, they just
   * gave us a reference to the convenience constructor - we'll instantiate it
   * on their behalf.
   */
  var callerPassedInInstance = instanceOrConstructor.props;
  var topLevelCreateData = FUtils.mergeStuff(
        baseTopLevelProps,
        callerPassedInInstance ? instanceOrConstructor.props : {});
  var topLevelInstance =
        (callerPassedInInstance ? instanceOrConstructor :
         instanceOrConstructor(topLevelCreateData));

  if (renderOptions &&
      renderOptions.appStyle &&
      document.body.className.indexOf('nover') === -1) {
    document.body.className += ' nover';
  }
  var renderedComponentInstance =
      renderAt(topLevelInstance, mountAtId, renderOptions);

  /**
   * Refresher function that does a control on the rendered dom node whenever
   * something in the top level data pipeline changes. This wipes out any
   * existing handler.
   */
  if (renderOptions.applicationResizeBatchTimeMs) {
    FEvent.applicationResizeBatchTimeMs =
        renderOptions.applicationResizeBatchTimeMs;
  }

  /**
   * For all of these browser events - we need to gracefully merge in the
   * properties that were already set (and merged in) by the top level.
   */
  FEvent.applicationResizeListener = function() {
    var updateProps = {
      chromeHeight : FEnv.viewportHeight,
      chromeWidth : FEnv.viewportWidth,
      cookies: cookies
    };
    renderedComponentInstance.updateAllProps(
        FUtils.mergeStuff(updateProps, renderedComponentInstance.props));
  };

  /**
   * We don't requery the dims when the cookie changes.
   */
  FBrowserUtils._onCookieChange = function() {
    cookies = FBrowserUtils.readCookie() || {};
    var updateProps = {
      chromeHeight : FEnv.viewportHeight,
      chromeWidth: FEnv.viewportWidth,
      cookies: cookies
    };
    renderedComponentInstance.updateAllProps(
      FUtils.mergeStuff(updateProps, renderedComponentInstance.props));
  };

  return renderedComponentInstance;
}





/**
 * _usingInImpl: Deprecated if never using tail constructors.  Copies all
 * Components from a package to namespace for declarative use.  Ensures that
 * each member has been transformed into a component constructor, if hasn't
 * already been done.
 */
var _usingInImpl = function(namespace, uiPackages) {
  if (!namespace) {
    _Fax.Error(FErrors.NAMESPACE_FALSEY);
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
        /* might already be a constructor. Otherwise it might be a random data
         * blob that is exported as part of the package. */
        if (typeof packageVal === 'function') {
          namespace[uiComponent] = packageVal;
        } else if(packageVal && packageVal.structure !== undefined) {
          namespace[uiComponent] =
            FStructuredComponent.Componentize(packageVal);
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

/**
 * @using: Deprecated if never using tail constuctors.
 */
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
  disableSelectionGlobally: FEvent.disableSelectionGlobally,
  enableSelectionGlobally: FEvent.enableSelectionGlobally,
  _abstractEventListenersById: FEvent.abstractEventListenersById,
  MakeHighLevelComponentClass: FStructuredComponent.MakeHighLevelComponentClass,
  Componentize: FStructuredComponent.Componentize,
  ComponentizeAll: FStructuredComponent.ComponentizeAll,
  forceClientRendering: true,
  renderAt: renderAt,
  using: using,
  populateNamespace: null,
  STRETCH: {top: 0, left: 0, right: 0, bottom: 0, position: 'absolute'},
  appendMarkup: _appendMarkup,
  getViewportDims: FBrowserUtils.getViewportDims,
  clearBeforeRenderingQueue: _Fax.clearBeforeRenderingQueue,
  renderingStrategies: renderingStrategies,
  _onlyGenMarkupOnProjection: _Fax._onlyGenMarkupOnProjection,
  getTotalInstantiationTime: function() { return _Fax.totalInstantiationTime; },
  releaseMemoryReferences: FDomMutation.releaseMemoryReferences,

  /* FUtils reexport */
  mergeStuff: FUtils.mergeStuff,
  curryOne: FUtils.curryOne,
  bindNoArgs: FUtils.bindNoArgs,
  curryOnly: FUtils.curryOnly,
  maybeInvoke: FUtils.maybeInvoke,
  objMap: FUtils.objMap,
  oMap: FUtils.objMap,
  arrPull: FUtils.arrPull,
  arrPullJoin: FUtils.arrPullJoin,
  arrCategorize: FUtils.arrCategorize,
  map: FUtils.map,
  mapRange: FUtils.mapRange,
  mapSlice: FUtils.mapSlice,
  mapSubSequence: FUtils.mapSubSequence,
  mapIndices: FUtils.mapIndices,
  arrToObj: FUtils.arrToObj,
  reduce: FUtils.reduce,
  objMapToArray: FUtils.objMapToArray,
  objMapFilter: FUtils.objMapFilter,
  arrMapToObj: FUtils.arrMapToObj,
  arrMapToKeyVal: FUtils.arrMapToKeyVal,
  arrMapToObjAutoKey: FUtils.arrMapToObjAutoKey,
  keys: FUtils.keys,
  keyCount: FUtils.keyCount,
  objSubset: FUtils.objSubset,
  objExclusion: FUtils.objExclusion,
  copyProps: FUtils.copyProps,
  shallowClone: FUtils.shallowClone,
  merge: FUtils.merge,
  mergeThree: FUtils.mergeThree,
  mergeDeep: FUtils.mergeDeep,
  clone: FUtils.clone,
  indexOfStruct: FUtils.indexOfStruct,
  canFind: FUtils.canFind,
  firstFound: FUtils.firstFound,
  structExists: FUtils.structExists,
  keyMirror: FUtils.keyMirror,
  keyOf: FUtils.keyOf,
  renderTopLevelComponentAt: renderTopLevelComponentAt,

  /* FDomAttributes reexport */
  posOffset: FDomAttributes.posOffset,
  posOffsetIfPosInfo: FDomAttributes.posOffsetIfPosInfo,
  serializeInlineStyle: FDomUtils.serializeInlineStyle,

  /* Export sub modules. */
  FUtils: FUtils,
  FDomUtils: FDomUtils,
  FStructuredComponent: FStructuredComponent,
  FErrors: FErrors,
  FEvent: FEvent,
  FDomGeneration: FDomGeneration,
  FDomMutation: FDomMutation,
  FDomAttributes: FDomAttributes,
  FDomTraversal: FDomTraversal
};
/**
 * Members used to work around object key minification are the only entry points
 * that need to avoid object key minification.
 */
Fax['keyOf'] = FUtils.keyOf;

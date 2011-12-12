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
 * Fax/FaxEvent.js - FaxUi event system module.
 */
var FEnv = require('./FEnv'),
    F = require('./Fax');

// Forward Declaration
var FaxEvent;


/**
 * Helper class. Provides a nicer api for a conceptual 'event'. Eliminates some
 * cross-browser inconsistencies. In the future, continue to place x-browser
 * event normalization here if possible, and it applies to all events. Gradually
 * expand this out to become a very useful normalized object.
 * Note, an abstract event should probably always just have an abstractEventType
 * that is a base type (not include any 'Direct' or 'FirstHandler' concept.)
 * That makes this a bit awkward to reason about, as there's nothing in the apis
 * that will enforce that. Just something to think about.
 * It's clear that an "Abstract" event is different than an abstract handler
 * type. An abstract handler type describes which abstract events to listen for,
 * and under which contexts those abstract events apply to the listener (which
 * mode, that is (Direct etc.)
 */
function AbstractEvent(abstractEventType,
                       originatingTopLevelEventType,
                       target,
                       nativeEvent,
                       data) {
  this.abstractEventType = abstractEventType;
  this.originatingTopLevelEventType = originatingTopLevelEventType;
  this.target = target;
  this.nativeEvent = nativeEvent;
  this.data = data || {};
}

AbstractEvent.prototype.preventDefault = function() {
  if(this.nativeEvent.preventDefault) {
    this.nativeEvent.preventDefault();
  } else {
    this.nativeEvent.returnValue = false;
  }
};

var abstractHandlerTypes = {
  onScroll: 1, onTouchTap: 2, onTouchEnd: 3, onTouchMove: 4, onTouchStart: 5,
  onQuantizeTouchDrag: 6, onTouchDragDone: 7, onClick: 8, onDragDone: 9,
  onQuantizeDrag: 10, onMouseWheel: 11, onKeyUp: 12, onKeyDown: 13,
  onKeyPress: 14, onFocus: 15, onBlur: 16, onMouseIn: 17, onMouseOut: 18,
  onMouseDown: 19, onMouseUp: 20,

  /* Direct handlers */
  onScrollDirect: 101, onTouchTapDirect: 102, onTouchEndDirect: 103,
  onTouchMoveDirect: 104, onTouchStartDirect: 105,
  onQuantizeTouchDragDirect: 106, onTouchDragDoneDirect: 107,
  onClickDirect: 108, onDragDoneDirect: 109, onQuantizeDragDirect: 110,
  onMouseWheelDirect: 111, onKeyUpDirect: 112, onKeyDownDirect: 113,
  onKeyPressDirect: 114, onFocusDirect: 115, onBlurDirect: 116,
  onMouseInDirect: 117, onMouseOutDirect: 118, onMouseDownDirect: 119,
  onMouseUpDirect: 120,

  /* First handlers */
  onScrollFirstHandler: 201, onTouchTapFirstHandler: 202,
  onTouchEndFirstHandler: 203, onTouchMoveFirstHandler: 204,
  onTouchStartFirstHandler: 205, onQuantizeTouchDragFirstHandler: 206,
  onTouchDragDoneFirstHandler: 207, onClickFirstHandler: 208,
  onDragDoneFirstHandler: 209, onQuantizeDragFirstHandler: 210,
  onMouseWheelFirstHandler: 211, onKeyUpFirstHandler: 212,
  onKeyDownFirstHandler: 213, onKeyPressFirstHandler: 214,
  onFocusFirstHandler: 215, onBlurFirstHandler: 216,
  onMouseInFirstHandler: 217, onMouseOutFirstHandler: 218,
  onMouseDownFirstHandler: 219, onMouseUpFirstHandler: 220
};


/**
 * Raw signals from the browser caught at the top level.
 */
var topLevelEventTypes = {
  topLevelMouseMove: { type: 1 },
  topLevelMouseIn: { type: 2 },
  topLevelMouseDown: { type: 3, mappedToAbstractHandlerType: abstractHandlerTypes.onMouseDown },
  topLevelMouseUp: { type: 4, mappedToAbstractHandlerType: abstractHandlerTypes.onMouseUp },
  topLevelMouseOut: { type: 5 },
  topLevelClick: { type: 6, mappedToAbstractHandlerType: abstractHandlerTypes.onClick },
  topLevelMouseWheel: { type: 7, mappedToAbstractHandlerType: abstractHandlerTypes.onMouseWheel },
  topLevelTouchStart: { type: 8, mappedToAbstractHandlerType: abstractHandlerTypes.onTouchStart },
  topLevelTouchEnd: { type: 9, mappedToAbstractHandlerType: abstractHandlerTypes.onTouchEnd},
  topLevelTouchMove: { type: 10, mappedToAbstractHandlerType: abstractHandlerTypes.onTouchMove },
  topLevelTouchCancel: { type: 11 },
  topLevelKeyUp: { type: 12, mappedToAbstractHandlerType: abstractHandlerTypes.onKeyUp },
  topLevelKeyPress: { type: 13, mappedToAbstractHandlerType: abstractHandlerTypes.onKeyPress },
  topLevelKeyDown: { type: 14, mappedToAbstractHandlerType: abstractHandlerTypes.onKeyDown },
  topLevelFocus: { type: 15, mappedToAbstractHandlerType:  abstractHandlerTypes.onFocus },
  topLevelBlur: { type: 16, mappedToAbstractHandlerType: abstractHandlerTypes.onBlur },
  topLevelScroll: { type: 17, mappedToAbstractHandlerType: abstractHandlerTypes.onScroll }
};

function _constructAbstractEventDirectlyFromTopLevel(topLevelEventType,
                                                     nativeEvent,
                                                     target) {
  var data;
  switch(topLevelEventType) {
    case topLevelEventTypes.topLevelMouseWheel:
      data = FaxEvent._normalizeAbstractMouseWheelEventData(nativeEvent, target);
      break;
    case topLevelEventTypes.topLevelScroll:
      data = FaxEvent._normalizeAbstractScrollEventData(nativeEvent, target);
      break;
    case topLevelEventTypes.topLevelClick:
    case topLevelEventTypes.topLevelMouseDown:
    case topLevelEventTypes.topLevelMouseUp:
    case topLevelEventTypes.topLevelTouchMove:
    case topLevelEventTypes.topLevelTouchStart:
    case topLevelEventTypes.topLevelTouchEnd:
      data = FaxEvent._normalizeMouseData(nativeEvent, target);
      break;
    default:
      data = {};
  }

  return new AbstractEvent(
      topLevelEventType.mappedToAbstractHandlerType,
      topLevelEventType,
      target,
      nativeEvent,
      data);
}

/**
 * Fax events module.
 */
FaxEvent = {
  /**
   * The event system keeps track of some global state, in order to infer
   * abstract events that occur over a sequence of more than one top level
   * event. The 'active' drag handlers are handlers that are currently active
   * and should receive drag signals when the mouse is used. The bubbling has
   * already occured at the time of mouse down and the set of registered drag
   * handlers have been stored in these global sets. We'll reuse this global
   * store for both mouse and also touch events.
   */
  activeDragListenersByListenerDesc : {},
  currentlyPressingDown: false,
  activeDragListenersCount : 0,
  activeDragDoneListenersByListenerDesc : {},
  activeDragDoneListenersCount: 0,
  lastTouchedDownAtX : null,
  lastTouchedDownAtY : null,
  lastTriggeredDragAtX : null,
  lastTriggeredDragAtY : null,
  lastTriggeredDragAtTime : 0,
  listeningYet: false,

  /* Arbitrarily choose 3 as the required delta - easy to customize later.
   * Mouse move events can trigger huge propagations in ui appearance and it's
   * nice to be able to only do this occasionally. We'll offer two things, 1.
   * Custom sample rate, 2. Adaptive sampling - sample less when each signal
   * takes a longer amount of time to respond to - trailing average. */
  DRAG_PIXEL_SAMPLE_RATE : 2,

  /**
   * Will not fire drag events spaced further apart than 50 milliseconds.
   */
  DRAG_TIME_SAMPLE_THRESH: 25,

  /**
   * The number of pixels that are tolerated in between a touchStart and
   * touchEnd in order to still be considered a 'tap' event. */
  TAP_MOVEMENT_THRESHOLD : 10,

  /* This funny initialization is only needed so that browserify can reload
   * modules from a local cache. */
  abstractEventListenersById : {},

  /**
   * Key compression friendly event handler types. You can refer by key name,
   * and that will get minified. But we need a predictable schema to refer to
   * them at the system level because of the way the code is designed. It takes
   * a base name and needs to dynamically infer the associated Direct/First
   * Handler version as well. The way we'll do it for now, is give each base
   * type a number between 1-99 and add a "hundreds offset" for each "mode" of
   * handler (Direct/First Handler).
   * Long term solution make an algorithm intrinsically resilient to key
   * compression.
   *
   * Keys will be minified, values are identities of those event handlers and
   * will not be minified. We can make assumptions about the values and use
   * *those* as the actual types.
   */
  abstractHandlerTypes : abstractHandlerTypes,

  /**
   * The various event modes and their respective offsets.
   */
  EventModes: {
    Default: 0,
    Direct: 100,
    FirstHandler: 200
  },

  /**
   * The top level method that kicks off rendering to the dom should call this.
   */
  ensureListening: function(mountAt, touchInsteadOfMouse) {
    if (!FaxEvent.listeningYet) {
      FaxEvent.registerTopLevelListeners(mountAt, touchInsteadOfMouse);
      FaxEvent.listeningYet = true;
    }
  },

  /** Puts a particular event listener on the queue.  */
  enqueueEventReg : function (id, listener) {
    FaxEvent.abstractEventListenersById[
        id + "@" + listener.listenForAbstractHandlerType] = listener;
  },

  /**
   * Also performs the mapping from handler name to abstract event name.
   */
  registerHandlerByName : function(domNodeId, propName, handler) {
    if(FaxEvent.abstractHandlerTypes[propName]) {
      FaxEvent.enqueueEventReg(domNodeId, {
        listenForAbstractHandlerType: FaxEvent.abstractHandlerTypes[propName],
        callThis: handler
      });
    }
  },

  /**
   * Also performs the mapping from handler name to abstract event name.
   */
  registerHandlers : function(domNodeId, props) {
    var handlerName;
    for (handlerName in FaxEvent.abstractHandlerTypes) {
      if (!FaxEvent.abstractHandlerTypes.hasOwnProperty(handlerName)) {
        continue;
      }
      var handler = props[handlerName];
      if(handler) {
        FaxEvent.enqueueEventReg(domNodeId, {
            listenForAbstractHandlerType: FaxEvent.abstractHandlerTypes[handlerName],
            callThis: handler
        });
      }
    }
  },

  __trapCapturedEvent: function (topLevelEventType, captureNativeEventType, onWhat) {
    var ourHandler = function(eParam) {
      var nativeEvent  = eParam || window.event;
      var targ  = nativeEvent.target || nativeEvent.srcElement;
      if (targ.nodeType === 3) {
        targ = targ.parentNode;
      }
      _handleTopLevel(topLevelEventType, nativeEvent, targ);
    };
    if (!onWhat.addEventListener) {
      onWhat.attachEvent(captureNativeEventType, ourHandler);
    } else {
      onWhat.addEventListener(captureNativeEventType, ourHandler , true);
    }
  },

  /**
   * Blatantly duplicating this event normalization code (same as
   * __trapCapturedEvent) for performance reasons. Factoring out into helper
   * method would hurt a bit. This code is very critical to performance since it
   * is called very frequently.  http://jsperf.com/calling-function-vs-not
   * You'll also notice that we don't extensively normalize all of the event
   * data here, instead we normalize it as we need it (to save cpu).
   */
  __trapBubbledEvent: function(topLevelEventType, windowHandlerName, onWhat) {
    var ourHandler = function(eParam) {
      var nativeEvent  = eParam || window.event;
      var targ  = nativeEvent.target || nativeEvent.srcElement;
      if (targ.nodeType === 3) { // defeat Safari bug
        targ = targ.parentNode;
      }
      _handleTopLevel(topLevelEventType, nativeEvent, targ);
    };
    if (onWhat[windowHandlerName]) {
      onWhat[windowHandlerName] = function(nativeEvent) {
        ourHandler(nativeEvent);
        onWhat[windowHandlerName](nativeEvent);
      };
    } else {
      onWhat[windowHandlerName] = function(nativeEvent) {
        ourHandler(nativeEvent);
      };
    }
  },

  /**
   * Just inline this in critical sections of code.
   */
  _getTarget: function(nativeEvent) {
    nativeEvent = nativeEvent || window.event;
    var targ  = nativeEvent.target || nativeEvent.srcElement;
    if (targ.nodeType === 3) { // defeat Safari bug
      targ = targ.parentNode;
    }
    return targ;
  },

  topLevelEventTypeIsUsableAsAbstract: function(topLevelEventType) {
    return !!topLevelEventType.mappedToAbstractHandlerType;
  },

  dispatchAllAbstractEventsToListeners: function (id, mode, abstractEvents) {
    var i, foundOne = false, maybeEventListener = null, abstractEvent,
        abstractEventListenersById = FaxEvent.abstractEventListenersById;
    for (i=0; i < abstractEvents.length; i=i+1) {
      abstractEvent = abstractEvents[i];
      maybeEventListener = abstractEventListenersById[
        id + '@' + (abstractEvent.abstractEventType + mode)
      ];
      if (maybeEventListener) {
        maybeEventListener.callThis(abstractEvent, abstractEvent.nativeEvent);
        foundOne = true;
      }
    }
    return foundOne;
  },

  /**
   * Triggers any registered events on an id as part of a very regular bubbling
   * procedure (meaning straight up to the top, not like mouseIn/Out).
   * It's kind of funny how in the standard bubbling iteration we reason a lot
   * about drag handlers - never call them. Yet on mouse move or mouse ups type
   * handlers we don't even talk about bubbling. It's because all of the bubbling
   * (even for draggy events) were 'locked' in at the time of mouse down (this
   * function, actually).
   * Another funny thing about this function is that we infer high level onTouchTap
   * events here. We never "locked those in" at mouse down time though we could have.
   * The motive for locking in mouse move events was performance. Why recalculate
   * the exact same bubble path on every pixel? That would have been costly. But
   * onTouchTap shouldn't concern us - though it might be cleaner to lock it in
   * on mouse down - #todo (we should do this now because when there are multiple
   * fingers on the page, we need to know who started the touch down, so that when
   * we get a touchEnd event we can match it with the one that started the touch.)
   *
   * @mode: Such as 'Direct' or 'FirstHandler'.
   * @returns whether or not the event was handled by the dom node with this id
   */
  standardBubblingIteration: function(nextId,
                                      topLevelEventType,
                                      mode,
                                      nativeEvent,
                                      targ) {
  
    var nextIdAt = nextId + '@',
        abstractHandlerTypes = FaxEvent.abstractHandlerTypes,      
        abstractEventListenersById = FaxEvent.abstractEventListenersById,
        mouseDownDragDesc = nextIdAt + (abstractHandlerTypes.onQuantizeDrag + mode),
        touchStartDragDesc = nextIdAt + (abstractHandlerTypes.onQuantizeTouchDrag + mode),
        mouseDownDragDoneDesc = nextIdAt + (abstractHandlerTypes.onDragDone + mode),
        touchStartDragDoneDesc = nextIdAt + (abstractHandlerTypes.onTouchDragDone + mode),
        dragDesc = topLevelEventType === topLevelEventTypes.topLevelMouseDown ? mouseDownDragDesc :
                   topLevelEventType === topLevelEventTypes.topLevelTouchStart ? touchStartDragDesc :
                   false, // in this case you won't be using it anyways.
        dragDoneDesc = topLevelEventType === topLevelEventTypes.topLevelMouseDown ? mouseDownDragDoneDesc :
                   topLevelEventType === topLevelEventTypes.topLevelTouchStart ? touchStartDragDoneDesc:
                   false; // in this case you won't be using it anyways.

    var handledLowLevelEventByRegisteringDragListeners,
        handledLowLevelEventByFindingRelevantListeners = false;
    /** Lazily defined when we first need it. */
    var abstractEvents = [],
        newAbstractEvent,
        globalX,
        globalY;

    if (topLevelEventType === topLevelEventTypes.topLevelMouseDown ||
        topLevelEventType === topLevelEventTypes.topLevelTouchStart) {

      globalX = FaxEvent.eventGlobalX(nativeEvent, true);
      globalY = FaxEvent.eventGlobalY(nativeEvent, true);
      FaxEvent.currentlyPressingDown = true;
      FaxEvent.lastTouchedDownAtX = globalX;
      FaxEvent.lastTouchedDownAtY = globalY;

      if (abstractEventListenersById[dragDesc]) {
        newAbstractEvent = _constructAbstractEventDirectlyFromTopLevel(
            topLevelEventType, nativeEvent, targ);
        abstractEvents.push(newAbstractEvent);

        /* even if nothing handles the mouse down, and something handles the
         * click, we say that anything above this in the dom tree will not be
         * the first handler, whether or not they're listening for clicks vs.
         * drags. We can eventually change that to care about what exactly was
         * handled, but this is kind of convenient.*/
        if(!newAbstractEvent.data.rightMouseButton) {
          handledLowLevelEventByRegisteringDragListeners = true;
          FaxEvent.activeDragListenersByListenerDesc[dragDesc] =
              abstractEventListenersById[dragDesc];
          FaxEvent.activeDragListenersCount++;
          var activeDragDoneListenerForNextId =
              abstractEventListenersById[dragDoneDesc];
          if (activeDragDoneListenerForNextId) {
            FaxEvent.activeDragDoneListenersByListenerDesc[dragDoneDesc] =
                activeDragDoneListenerForNextId;
            FaxEvent.activeDragDoneListenersCount++;
          }
          FaxEvent.lastTriggeredDragAtX = globalX; // not really, but works
          FaxEvent.lastTriggeredDragAtY = globalY;
          // Setting this to zero, so that the very first drag event will never
          // be held back on account of the drag time. In fact it might be a good
          // idea to do something similar with the other two global trackers
          // (x/y)
          FaxEvent.lastTriggeredDragAtTime = 0;
        }
      }
    } else if (topLevelEventType === topLevelEventTypes.topLevelTouchEnd) {
      globalX = FaxEvent.eventGlobalX(nativeEvent);
      globalY = FaxEvent.eventGlobalY(nativeEvent);

      var totalDistanceSinceLastTouchedDown =
          Math.abs(globalX - FaxEvent.lastTouchedDownAtX) +
          Math.abs(globalY - FaxEvent.lastTouchedDownAtY);
      if (totalDistanceSinceLastTouchedDown < FaxEvent.TAP_MOVEMENT_THRESHOLD) {
        /* Code below will search for handlers that are interested in this
         * abstract event. */
        abstractEvents.push(new AbstractEvent(
            abstractHandlerTypes.onTouchTap,
            topLevelEventType,
            targ,
            nativeEvent,
            {})
        );
      }
    }

    /*
     * We may have needed to register drag listeners, or infer touchTaps, but we still
     * might need those same top level event types that we used to call handlers that
     * are 'directly mapped' to those topLevelEventTypes. (such as onTouchStart etc).
     */
    if (FaxEvent.topLevelEventTypeIsUsableAsAbstract(topLevelEventType)) {
      /**
       * Some abstract events are just simple one-one corresponding event types
       * with top level events.
       */
      abstractEvents.push(_constructAbstractEventDirectlyFromTopLevel(
          topLevelEventType, nativeEvent, targ));
    }

    handledLowLevelEventByFindingRelevantListeners =
        FaxEvent.dispatchAllAbstractEventsToListeners(
          nextId, mode, abstractEvents);

    return handledLowLevelEventByFindingRelevantListeners ||
           handledLowLevelEventByRegisteringDragListeners;
  },

  /** I <3 Quirksmode.org */
  _isNativeClickEventRightClick: function(nativeEvent) {
    return nativeEvent.which ? nativeEvent.which === 3 :
           nativeEvent.button ? nativeEvent.button === 3 :
           false;
  },

  /**
   * There are some normalizations that need to happen for various browsers.  In
   * addition to replacing the general event fixing with a framework such as
   * jquery, we need to normalize mouse events here.  The below is mostly borrowed
   * from: jScrollPane/script/jquery.mousewheel.js
   */
  _normalizeAbstractMouseWheelEventData: function(event /*native */, target) {
    var orgEvent = event, args, delta = 0, deltaX = 0, deltaY = 0;

    /* traditional scroll wheel data */
    if ( event.wheelDelta ) { delta = event.wheelDelta/120; }
    if ( event.detail     ) { delta = -event.detail/3; }

    /* Multidimensional scroll (touchpads) with deltas */
    deltaY = delta;

    /* Gecko based browsers */
    if (orgEvent.axis !== undefined &&
         orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }

    /* Webkit based browsers */
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }

    return { delta: delta, deltaX: deltaX, deltaY: deltaY };
  },

  _normalizeAbstractScrollEventData: function(event /*native */, target) {
    return {
      scrollTop: target.scrollTop,
      scrollLeft: target.scrollLeft,
      clientWidth: target.clientWidth,
      clientHeight: target.clientHeight,
      scrollHeight: target.scrollHeight,
      scrollWidth: target.scrollWidth
    };
  },

  /**
   * Note: for touchEnd the touches will usually be empty, or not what you
   * would think they are. Just don't rely on them for handling touchEnd events.
   * http://stackoverflow.com/questions/3666929/
   *    mobile-sarai-touchend-event-not-firing-when-last-touch-is-removed
   * We're usually only interested in single finger gestures or mouse clicks,
   * which is why we only care about touches of length 1.
   * We can extract more interesting gesture patterns later.
   */
  eventGlobalY: function(event, log) {
    if ((!event.touches || event.touches.length === 0) &&
        event.changedTouches && event.changedTouches.length === 1) {
      return event.changedTouches[0].pageY;
    }
    if(event.touches && event.touches.length === 1) {
      return event.touches[0].pageY;
    }
    return event.pageY !== undefined ? event.pageY :
                event.clientY + FEnv.currentScrollTop;
  },
  eventGlobalX: function(event, log) {
    if ((!event.touches || event.touches.length === 0) &&
        event.changedTouches && event.changedTouches.length === 1) {
      return event.changedTouches[0].pageX;
    }
    if(event.touches && event.touches[0]) {
      return event.touches[0].pageX;
    }
    return event.pageX !== undefined ? event.pageX :
                event.clientX + FEnv.currentScrollLeft;
  },
  _normalizeMouseData: function(event /*native */, target) {
    return {
      globalX: FaxEvent.eventGlobalX(event),
      globalY: FaxEvent.eventGlobalY(event),
      rightMouseButton: FaxEvent._isNativeClickEventRightClick(event)
    };
  },

  _normalizeAbstractDragEventData: function(event /*native*/,
                                            globalX,
                                            globalY,
                                            lastTouchedDownAtX,
                                            lastTouchedDownAtY) {
    return {
      globalX: globalX, globalY: globalY,
      startX: lastTouchedDownAtX, startY: lastTouchedDownAtY
    };
  },

  /* Well need to handle all events that have either a from or to starting with
   * a '.'.  This should be the first thing checked at the top.  We only need to
   * handle mouse out events, as we can always infer the mouse in event.  If we
   * handle both, we get duplicate events firing.  TODO: All of this would be
   * faster if I just used string.split('.'); TODO: These mouseIn and mouseOut
   * events should be inferred at the high level event inference stage of the
   * event processing pipeline. However, it's tough, because there are N x M
   * high level events that occurred. Maybe high level events just contain a
   * succinct description of what physically happened, and the dispatcher is
   * smart enough to know how to dispatch this to all concerned parties. When
   * plugging into the event system, One would only need to write the extracter
   * and the dispatcher.  TODO: mouseIn and out have different types of
   * bubbling. The mouse can jump lineage, from the 'from' branch to the 'to'
   * branch. We perform special bubbling from the from to the common ancestor
   * triggering the mouse out event.  We do not bubble any further. (Similarly
   * for mouse in). Ever person along that path has the opportunity to handle
   * the mouseIn/out and no one has the ability to top the propagation or
   * specify that they aren't interested in bubbled events. The 'out' event
   * occurred just as much on every single element in the from path to the
   * common ancestor. (Similarly with 'to'). */
  _handleMouseInOut: function(topLevelEventType, nativeEvent, targ) {
    var to = targ, from = targ, fromId = '', toId = '',
        abstractEventListenersById = FaxEvent.abstractEventListenersById;

    if (topLevelEventType === topLevelEventTypes.topLevelMouseIn) {
      from = nativeEvent.relatedTarget || nativeEvent.fromElement;
      if (from) {
        return; /* Listening only to mouse out events can catch all
                 * except mousing from outside
                 * window into the document. Otherwise we'll listen only
                 * for mouse outs.*/
      }
    } else {
      to = nativeEvent.relatedTarget || nativeEvent.toElement;
    }
    while (to && (!to.id || to.id.charAt(0) !== '.')) {
      to = to.parentNode;
    }
    while (from && (!from.id || from.id.charAt(0) !== '.')) {
      from = from.parentNode;
    }
    // Nothing pertains to our managed components.
    if (!from && !to) { return; }
    if (from && from.id) { fromId = from.id; }
    if (to && to.id) { toId = to.id; }
    var commonIdx = 0;

    // Stays this way if one of from/to is window.
    var commonAncestorId = '';
    var commonChars = 0;
    while (toId.charAt(commonChars) !== '' && fromId.charAt(commonChars) !== '' &&
           toId.charAt(commonChars) === fromId.charAt(commonChars)) {
      // Find the last common dot (with virtual dots at the end of the from/to)
      commonChars++;
    }
    // could use either to or from - they're in common!
    if (toId.charAt(commonChars-1) === '.') {
      commonAncestorId = toId.substr(0, commonChars - 1);  // remove the dot
    } else {
      /* Some cases that can happen
       * a.b.something a.b.some
       * a.b.something a.b.something.else
       * a.b.c.something a.b.canyouhearme
       * Use two without loss of generality.*/
      commonAncestorId = toId.substr(0, (toId.substr(0, commonChars)).lastIndexOf('.'));
    }

    var i, maybeEventListener, traverseId = fromId;
    if (from) {
      i = 0;
      while (traverseId !== commonAncestorId) {
        maybeEventListener = abstractEventListenersById[
            traverseId + '@' + FaxEvent.abstractHandlerTypes.onMouseOut
        ];
        if (maybeEventListener) {
          maybeEventListener.callThis(
            new AbstractEvent(
                FaxEvent.abstractHandlerTypes.onMouseOut,
                topLevelEventType, targ, nativeEvent, {}),
                targ, nativeEvent);
        }
        var oldtrav = traverseId;
        traverseId = traverseId.substr(0, traverseId.lastIndexOf('.'));
        i++;
        if (i > 200 ) {
          FaxEvent.Error('Runaway tree: ' + traverseId);
          return;
        }
      }
    }

    // todo: should not trigger on common ancestor.
    traverseId = toId.substr(0, commonAncestorId.length);
    if (to) {
      i = 0;
      while (traverseId !== toId) {
        traverseId = toId.indexOf('.', traverseId.length +1) === -1 ?
          toId :
          toId.substr(0, (toId.indexOf('.', traverseId.length+1)));
        maybeEventListener = abstractEventListenersById[
            traverseId + '@' + FaxEvent.abstractHandlerTypes.onMouseIn];
        if (maybeEventListener) {
          maybeEventListener.callThis(
              new AbstractEvent(
                FaxEvent.abstractHandlerTypes.onMouseIn, topLevelEventType, nativeEvent, {}),
              targ, nativeEvent);
        }
        i++;
        if (i > 200 ) {
          FaxEvent.Error('Runaway tree: ' + traverseId);
          return;
        }
      }
    }
    return;
  },

  /**
   * Handles events that are 'movementy', meaning mouse and touch drags, not mouse
   * in or out events which are more instantaneous in nature occurring at element
   * boundries and thus don't need the same quantization as movementy events.
   * From these top level movementy events we can infer (currently) two higher
   * level events (both drag events) (onQuantizeTouchDrag and onQuantizeDrag)
   */
  _handleMovementyTopLevelEvent: function(topLevelEventType, nativeEvent, targ) {
    if (!FaxEvent.currentlyPressingDown) {
      return;
    }

    var globalX, globalY, dragDesc, totalDistanceSinceLastDrag,
        nowMs, totalMsSinceLastDrag;

    globalX = FaxEvent.eventGlobalX(nativeEvent);
    globalY = FaxEvent.eventGlobalY(nativeEvent);


    if (FaxEvent.activeDragListenersCount) {
      // Not distance, but sum of deltas along both dimensions
      totalDistanceSinceLastDrag =
          Math.abs(globalX - FaxEvent.lastTriggeredDragAtX) +
          Math.abs(globalY - FaxEvent.lastTriggeredDragAtY);

      nowMs = (new Date()).getTime();
      totalMsSinceLastDrag = nowMs - FaxEvent.lastTriggeredDragAtTime;

      if(totalDistanceSinceLastDrag < FaxEvent.DRAG_PIXEL_SAMPLE_RATE ||
         totalMsSinceLastDrag < FaxEvent.DRAG_TIME_SAMPLE_THRESH) {
        return;
      }

      /* Okay, the active drag handlers bank could have either touched drag or regular
       * drag handlers, but practically you'll never be running in a context where
       * the two types could simultaneously exist - we don't need to check their
       * types - in fact we could consolidate this into a conceptual onAnyDrag event
       * early on.
       */
      for (dragDesc in FaxEvent.activeDragListenersByListenerDesc) {
        if (!FaxEvent.activeDragListenersByListenerDesc.hasOwnProperty(dragDesc)) {
          continue;
        }
        var abstractEventData = FaxEvent._normalizeAbstractDragEventData(
            nativeEvent, globalX, globalY,
            FaxEvent.lastTouchedDownAtX,
            FaxEvent.lastTouchedDownAtY),
            listener = FaxEvent.activeDragListenersByListenerDesc[dragDesc];

        var abstractEvent = new AbstractEvent(
          topLevelEventType === topLevelEventTypes.topLevelTouchMove ?
              abstractHandlerTypes.onQuantizeTouchDrag :
              abstractHandlerTypes.onQuantizeDrag,
          topLevelEventType,
          targ, nativeEvent, abstractEventData);
        listener.callThis.call(listener.context || null, abstractEvent, nativeEvent);
      }
      FaxEvent.lastTriggeredDragAtX = globalX;
      FaxEvent.lastTriggeredDragAtY = globalY;
      FaxEvent.lastTriggeredDragAtTime = nowMs;
    }
  },

  /**
   * Handles events that are of the "let up" nature, meaning a mouseup/touchup, but this
   * also gives us an opportunity to infer a higher level event onTouchTap (which is a
   * touchStart followed by not much movement followed by a touchEnd). We don't need to
   * immediately track the originating element that was toucheStarted upon because no
   * movement occured - except in the case where the touchStart hides the element, no
   * movement occurs then a touchEnd is observed. (We can fix that if it becomes an
   * issue.)
   */
  _handleLetUppyTopLevelEvent: function(topLevelEventType, nativeEvent, targ) {
    var globalX, globalY, dragDoneDesc,
        totalDistanceSinceLastTouchedDown, totalDistanceSinceLastDrag,
        activeDragDoneListenerForDragDesc;

    globalX = FaxEvent.eventGlobalX(nativeEvent);
    globalY = FaxEvent.eventGlobalY(nativeEvent);


    totalDistanceSinceLastTouchedDown =
        Math.abs(globalX - FaxEvent.lastTouchedDownAtX) +
        Math.abs(globalY - FaxEvent.lastTouchedDownAtY);

    if (FaxEvent.activeDragDoneListenersCount) {
      /* Only trigger the dragDone event if there has been some mouse movement
       * while the mouse was depressed (at same quantizeDrag threshold
       * (FaxEvent.DRAG_PIXEL_SAMPLE_RATE))*/
      if(totalDistanceSinceLastTouchedDown > FaxEvent.DRAG_PIXEL_SAMPLE_RATE) {
        for (dragDoneDesc in FaxEvent.activeDragDoneListenersByListenerDesc) {
          if (!FaxEvent.activeDragDoneListenersByListenerDesc.hasOwnProperty(dragDoneDesc)) {
            continue;
          }
          activeDragDoneListenerForDragDesc =
              FaxEvent.activeDragDoneListenersByListenerDesc[dragDoneDesc];
          var abstractEvent = new AbstractEvent(
              topLevelEventType === topLevelEventTypes.topLevelMouseUp ?
                  abstractHandlerTypes.onDragDone :
                  abstractHandlerTypes.onTouchDragDone,
              topLevelEventType, targ, nativeEvent, {});

          // Todo: pass an abstract event nicely normalized
          activeDragDoneListenerForDragDesc.callThis.call(
            activeDragDoneListenerForDragDesc.context || null);
        }
      }
    }

    /**
     * Currently, all drag handlers are locked down at the time of mousedown/
     * touchstart. All drag signal events are sent with respect to the initial
     * (single) mousedown/touchstart that triggered. In a world of multiple
     * input devices (or touches) that is not sufficient. For each drag handler
     * we need to remember the initial event that instigated the drag. That
     * will also make handling single taps easier - see the main top level
     * handler (we had to handle letUppy events very last because bubbling
     * needed certain data that it cleared.) Doing this right will be harder
     * than it sounds - we're talking about multiple drag events. That would
     * require that when multiple touches occur, and multiple touchmoves occur
     * that we track which originating objects should receive which signal
     * channel for touch events. Maybe the browser helps us out with this? 
     */
    FaxEvent.activeDragListenersByListenerDesc = {};
    FaxEvent.currentlyPressingDown = false;
    FaxEvent.activeDragListenersCount = 0;
    FaxEvent.activeDragDoneListenersCount = 0;
    FaxEvent.activeDragDoneListenersByListenerDesc = {};
    FaxEvent.lastTouchedDownAtX = 0;
    FaxEvent.lastTouchedDownAtY = 0;
  }
};


/**
 * The Fax system needs to listen to document scroll events to update the single
 * point of inventory on the document's currently scrolled to position. The idea
 * is that there's a single point where this is maintained and always kept up to
 * date. Anyone who wants to know that value should as the FEnv what the latest
 * value is. If everyone queried the document when they wanted to know the
 * value, they'd trigger reflows like mad. I don't think we needed to normalize
 * the target here. Check this on safari etc - we only care about one very
 * specific event on a very specific target - as long as it works for that case.
 * TODO: Make resizing recalculate these as well. 
 */
FaxEvent.registerDocumentScrollListener = function() {
  var previousDocumentScroll = document.onscroll;
  document.onscroll = function(nativeEvent) {
    if(nativeEvent.target === document) {
      FEnv.refreshAuthoritativeScrollValues();
    }
    if(previousDocumentScroll) { previousDocumentScroll(nativeEvent); }
    if (FaxEvent.applicationDocumentScrollListener) {
      FaxEvent.applicationDocumentScrollListener(nativeEvent);
    }
  };
};

/**
 * Default resize batching time is zero (n/a) but you can set this to whatever
 * ms you want elapsed in between firing application registered resize events.
 * If you reset the FEnv's knowledge of viewport dimensions on every resize,
 * you could be causing an entirely new reflow.
 */
FaxEvent.applicationResizeBatchTimeMs = 0;
FaxEvent.registerWindowResizeListener = function() {
  var previousResizeListener = window.onresize;   
  var pendingCallback = null;
  var lastMs = (new Date()).getTime(), now, ellapsed;
  window.onresize = function(nativeEvent) {
    now = (new Date()).getTime();
    ellapsed = now - lastMs;
    if (!pendingCallback) {
      pendingCallback = true;
      window.setTimeout(function(nativeEvent) {
          FEnv.refreshAuthoritativeViewportValues();
          if (previousResizeListener) {previousResizeListener(nativeEvent);}
          if (FaxEvent.applicationResizeListener) {
            FaxEvent.applicationResizeListener(nativeEvent);
          }
          pendingCallback = false;
          lastMs = now;
        }, Math.max(FaxEvent.applicationResizeBatchTimeMs - ellapsed + 1, 1));
      return; // Don't trigger a reflow by querying for the window dimensions   
    }
  };
}; 

/**
 * This is just for IE only. For other browsers, we can easily apply a noselect
 * class. In IE we need to inspect every element that was selected and see if it
 * had a noselect class on it :( This also deactivates that horrible horrible
 * horrible horrible "accelerator" popups on IE8.
 */
FaxEvent.registerIeOnSelectStartListener = function() {
  var previousOnSelectStart = document.onselectstart;
  document.onselectstart = function(nativeEvent) {
    var targ = FaxEvent._getTarget(nativeEvent);
    if (targ.className &&
        (targ.className.search(/noSelect/) !== -1 ||
        targ.className.search(/material/) !== -1)) {
      (nativeEvent || window.event).returnValue = false;
    }
    if (previousOnSelectStart) {
      previousOnSelectStart(nativeEvent || window.event);
    }
  };
};


/**
 * ----------------------------------------------------------------------------
 * Events Summary: We trap low level, and often browser specify 'native' events
 * at the top level (window/document). We dedupe cross-browser events
 * (DOMMouseScroll/mouseWheel) and interpret the native events into something
 * called 'abstract' events which should be events that contain the most
 * obviously useful information about the event that occurred - in the most
 * cross-platform way. We don't append data to the native event, but rather
 * construct a new object that acts normally and only contains the most
 * frequently used, cross-platform data. For example, some browsers might store
 * mouse coordinates in the native events as clientX and some store it as pageX.
 * In the abstract event, we'd likely normalize and store that conceptual value
 * in a new abstract event object in a field 'mouseX'.
 * ----------------------------------------------------------------------------
 */

FaxEvent.registerTopLevelListeners = function(mountAt, touchInsteadOfMouse) {
  FaxEvent.registerDocumentScrollListener();
  FaxEvent.registerWindowResizeListener();
  FaxEvent.registerIeOnSelectStartListener();

  /**
   * #todoie: onmouseover/out do not work on the window element on IE*, will
   * likely need to capture using addEventListener/attachEvent.
   */
  if (!touchInsteadOfMouse) {
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelMouseMove, 'onmousemove', document);
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelMouseIn, 'onmouseover', mountAt || document);
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelMouseDown, 'onmousedown', mountAt || document);
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelMouseUp, 'onmouseup', document);
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelMouseOut, 'onmouseout', mountAt || document);
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelClick, 'onclick', mountAt || document);
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelMouseWheel, 'onmousewheel', mountAt || document);
  } else {
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelTouchStart, 'ontouchstart', document);
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelTouchEnd, 'ontouchend', document);
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelTouchMove, 'ontouchmove', document);
    // We don't allow clients to handle touch cancel but the system needs it.
    FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelTouchCancel, 'ontouchcancel', document);

  }

  /**
   * #todoie: Supposedly, keyup/press/down won't bubble to window on ie, but
   * will bubble to document. Maybe we should just trap there.
   * http://www.quirksmode.org/dom/events/keys.html.
   */
  FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelKeyUp, 'onkeyup', mountAt || document);
  FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelKeyPress, 'onkeypress', mountAt || document);
  FaxEvent.__trapBubbledEvent(topLevelEventTypes.topLevelKeyDown, 'onkeydown', mountAt || document);

  /**
   * TODO: IE has focusin and focusout which bubble, and we don't need to use
   * event 'capturing'. We just need to switch on the user agent so we avoid
   * unnecessarily capturing the focus and blur events - not that it harms
   * anything.
   *
   * See: http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
   * focus and blur events do not bubble, but we can capture them on 'the way
   * down'.
   */
  FaxEvent.__trapCapturedEvent(topLevelEventTypes.topLevelFocus, 'focus', mountAt || window);
  FaxEvent.__trapCapturedEvent(topLevelEventTypes.topLevelBlur, 'blur', mountAt || window);


  /** http://www.quirksmode.org/dom/events/tests/scroll.html (Firefox needs to
   * capture a diff mouse scroll); No browser captures both simultaneously so we're good */
  FaxEvent.__trapCapturedEvent(topLevelEventTypes.topLevelMouseWheel, 'DOMMouseScroll', mountAt || document);
  FaxEvent.__trapCapturedEvent(topLevelEventTypes.topLevelScroll, 'scroll', mountAt || document);
};


/**
 * We test for the most time sensitive events first to get them out of the way
 * (we don't need any additional slow down when dispatching scroll/mousemove
 * events.
 * There's a couple different ways to handle the events, and we try to get the
 * most time sensitive out of the way first. The overall approach is that for
 * any given low level (top level) event type, the system may need to accumulate
 * state, and/or construct an array of "abstract" event types (which are the
 * type of events that components can actually listen to.) Some of the time
 * sensitive handlers (_handleMovementyTopLevelEvent) only try to construct a
 * single abstractEvent and find a listener for it, but I'd like the entire
 * process to become unified. It is the way it is now, mostly because it's
 * relatively fast to do. A really solid abstract event extraction system is
 * difficult but should look like the following:
 * Low level events =>
 *  (plugins defining a query on low level event stream, in addition to
 *    being able to store/clear global accumulated state)
 *  => construct an array of inferred abstract events
 *  => call listeners
 *  The main problem with this, is that certain events like mouse in/outs need
 *  (or at least I saw the need for) a unique bubbling process.
 */
function _handleTopLevel(topLevelEventType, nativeEvent, targ) {
  var nextId = targ.id;
  if (topLevelEventType === topLevelEventTypes.topLevelMouseMove) {
    FaxEvent._handleMovementyTopLevelEvent(topLevelEventType, nativeEvent, targ);
    return;
  }
  /** Return for mousemove because we don't yet support handling those native
   * events directly - let's support onTouchMove directly, however - won't return*/
  if (topLevelEventType === topLevelEventTypes.topLevelTouchMove) {
    FaxEvent._handleMovementyTopLevelEvent(topLevelEventType, nativeEvent, targ);
  }

  /** Now we begin the bubbling process! Get first dom
    * node with a registered id. */
  while (targ.parentNode && targ.parentNode !== targ &&
      (nextId === null || nextId.length === 0)) {
    targ = targ.parentNode;
    nextId = targ.id;
  }

  /** There is no touch analog to this. */
  if (topLevelEventType === topLevelEventTypes.topLevelMouseIn ||
      topLevelEventType === topLevelEventTypes.topLevelMouseOut) {
    FaxEvent._handleMouseInOut(topLevelEventType, nativeEvent, targ);
    return;
  }

  /**
   * We don't currently have a good way to tell the event system to "stop
   * bubbling". In fact, that somewhat breaks encapsulation. Parents have the
   * option, instead, to declare that they are interested in events that have
   * not been bubbled up, or events that may/may not have been bubbled, or,
   * optionally, anything that has may or may not have been bubbled yet has not
   * yet been handled by any contained elements.
   * Currently, we'll have two modes, 'direct' and default (which encompasses
   * direct events and bubbled). Not yet implemented explicitly specifying that
   * events must be indirect.
   */
  var handledYet = false;
  if(nextId && nextId.length !== 0) {
    handledYet = FaxEvent.standardBubblingIteration(
        nextId,
        topLevelEventType,
        FaxEvent.EventModes.Direct,
        nativeEvent,
        targ);
  }


  /**
   * Interesting subtlety. If a click is handled by a lower level, then a drag
   * does not count as a 'firstHandler'. I think that makes sense but might come
   * as a surprise.
   */
  while(nextId && nextId.length !== 0) {
    if (!handledYet) {
      handledYet = FaxEvent.standardBubblingIteration(
          nextId,
          topLevelEventType,
          FaxEvent.EventModes.FirstHandler,
          nativeEvent,
          targ);
    }
    handledYet = FaxEvent.standardBubblingIteration(
      nextId,
      topLevelEventType,
      FaxEvent.EventModes.Default,
      nativeEvent,
      targ) || handledYet; // Important that this || be on the end, not beg
    var lastIndexDot = nextId.lastIndexOf(".");
    // still works even if lastIndexDot is -1
    nextId = nextId.substr(0, lastIndexDot);
  }

  /**
   * This needs to occur last because it resets global information such as the
   * touched down location which the standard bubbling needs. Once we put touchTap
   * inference into the "lock down" phase of onTouchStart (in bubbling) we could
   * probably end up moving this back - if we trap all info needed at that point.
   */
  if (topLevelEventType === topLevelEventTypes.topLevelMouseUp ||
      topLevelEventType === topLevelEventTypes.topLevelTouchEnd ||
      topLevelEventType === topLevelEventTypes.topLevelTouchCancel) {
    FaxEvent._handleLetUppyTopLevelEvent(topLevelEventType, nativeEvent, targ);
    /* We don't return here because the mouse up event might need to be handled
     * in it's own right - _handleLetUppyTopLevelEvent only is used to infer
     * very high level events that involve accumulated state(such as drags etc)
     * but we'll still allow the low level ones as well.*/
  }

}

module.exports = FaxEvent;


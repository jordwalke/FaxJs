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
 * @FEvent.js - Top level event system module.
 */

/**
 * A note about touch events:  See:
 * http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
 * http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html Clicks
 * likely require mounting the event listener somewhere deep in the dom tree
 * (not at doc/window). Though we don't care much about clicks because they have
 * a 300 ms delay anyways and we roll our own clicks.  What is supported, is
 * actually very complicated and varies by version of iOS - please populate and
 * complete this table as you find more information. On IOS5
 * overflow:touch-scroll divs, rumor has it, that if you can listen to bubbled
 * touch events somewhere deep in the dom (document/one level deep?), if you
 * stop bubbling, you can prevent the rubber band.
 *
 * IOS5:
 * Using event bubbling - listening on dom element one level deep (from body):
 *   Could not get any touch events.
 * Using event bubbling - listening on dom element two level deep (from body):
 *   Could not get any touch events.
 * Using event bubbling - listening on document:
 *   Could get touch events, and could prevent default on the touch move.
 * Using event bubbling - listening on window:
 *   Could get touch events, and could prevent default on the touch move.
 *
 * Trap capture - listening on two deep from body
 *   Could NOT get touch events, and could NOT prevent default on touch move.
 * Trap capture - listening on one deep from body
 *   Could NOT get touch events, and could NOT prevent default on touch move.
 * Trap capture - listening on document
 *   Could get touch events, and could prevent default on the touch move.
 * Trap capture - listening on window
 *   Could get touch events, and could prevent default on the touch move.
 *
 * IOS4:
 * Using event bubbling - listening on dom element one level deep (from body):
 *   Could get touch events, and could prevent default on the touch move.
 * Using event bubbling - listening on dom element two level deep (from body):
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
 *   Could NOT get touch events, and could NOT prevent default on the touch
 *   move.
 *
 * At least for the iOS world, it seems listening for bubbled touch events on
 * the document object is actually the best for compatibility.
 *
 * In addition: Firefox v8.01 (and possibly others exhibited strange behavior
 * when mounting onmousemove events at some node that was not the document
 * element. The symptoms were that if your mouse is not moving over something
 * contained within that mount point (for example on the background) the top
 * level handlers for onmousemove won't be called. However, if you register the
 * mousemove on the document object, then it will of course catch all
 * mousemoves. This along with iOS quirks, justifies restricting top level
 * handlers to the document object only, at least for these movementy types of
 * events and possibly all events. There seems to be no reason for allowing
 * arbitrary mount points.
 *
 */

var FEnv = require('./FEnv');

// Forward Declaration
var FEvent;


/**
 * Helper class. Provides a nicer api for a conceptual 'event'. Eliminates some
 * cross-browser inconsistencies. In the future, continue to place x-browser
 * event normalization here if possible, and it applies to all events. Gradually
 * expand this out to become a very useful normalized object.
 * Note, an abstract event should probably always just have an abstractEventType
 * that is a base type (not include any 'Direct' or 'FirstHandler' concept.)
 * That makes this a bit awkward to reason about, as there's nothing in the APIs
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
  FEvent.preventDefaultOnNativeEvent(this.nativeEvent);
};

/**
 * @abstractHandlers: Type of abstract handlers.  Todo: Once there is a unified
 * events pipeline, drags, mousedowns, mouseups, dragdones should all be
 * rethought out. We need a way to listen for global "up" events by the id of
 * the object that was the down event. DragDone's work this way because they're
 * highly synthetic. But there is no equivalent for simply mouse up.  Someone
 * would want to listen to a mouse up event even if the mouse was not only the
 * object when "up" occured, but the mouse was over it when the "down" occured.
 * You could call this type of event onGlobalMouseUp.  Once there's a unified
 * event pipeline, this kind of thing would be much easier to implement
 * - as it's very much what we already do for drag done events.
 */
var abstractHandlers = {
  onScroll: 1, onTouchTap: 2, onTouchEnd: 3, onTouchMove: 4, onTouchStart: 5,
  onTouchDrag: 6, onTouchDragDone: 7, onClick: 8, onDragDone: 9,
  onDrag: 10, onMouseWheel: 11, onKeyUp: 12, onKeyDown: 13,
  onKeyPress: 14, onFocus: 15, onBlur: 16, onMouseIn: 17, onMouseOut: 18,
  onMouseDown: 19, onMouseUp: 20, onChange: 21,

  /* Direct handlers */
  onScrollDirect: 101, onTouchTapDirect: 102, onTouchEndDirect: 103,
  onTouchMoveDirect: 104, onTouchStartDirect: 105,
  onTouchDragDirect: 106, onTouchDragDoneDirect: 107,
  onClickDirect: 108, onDragDoneDirect: 109, onDragDirect: 110,
  onMouseWheelDirect: 111, onKeyUpDirect: 112, onKeyDownDirect: 113,
  onKeyPressDirect: 114, onFocusDirect: 115, onBlurDirect: 116,
  onMouseInDirect: 117, onMouseOutDirect: 118, onMouseDownDirect: 119,
  onMouseUpDirect: 120, onChangeDirect: 121,

  /* First handlers */
  onScrollFirstHandler: 201, onTouchTapFirstHandler: 202,
  onTouchEndFirstHandler: 203, onTouchMoveFirstHandler: 204,
  onTouchStartFirstHandler: 205, onTouchDragFirstHandler: 206,
  onTouchDragDoneFirstHandler: 207, onClickFirstHandler: 208,
  onDragDoneFirstHandler: 209, onDragFirstHandler: 210,
  onMouseWheelFirstHandler: 211, onKeyUpFirstHandler: 212,
  onKeyDownFirstHandler: 213, onKeyPressFirstHandler: 214,
  onFocusFirstHandler: 215, onBlurFirstHandler: 216,
  onMouseInFirstHandler: 217, onMouseOutFirstHandler: 218,
  onMouseDownFirstHandler: 219, onMouseUpFirstHandler: 220,
  onChangeFirstHandler: 221
};


/**
 * @topLevelEvents: Raw signals from the browser caught at the top level.
 */
var topLevelEvents = {
  mouseMove: {type: 1},
  mouseIn: {type: 2},
  mouseDown: {type: 3, mappedToAbstractHandler: abstractHandlers.onMouseDown},
  mouseUp: {type: 4, mappedToAbstractHandler: abstractHandlers.onMouseUp},
  mouseOut: {type: 5},
  click: {type: 6, mappedToAbstractHandler: abstractHandlers.onClick},
  mouseWheel: {type: 7, mappedToAbstractHandler: abstractHandlers.onMouseWheel},
  touchStart: {type: 8, mappedToAbstractHandler: abstractHandlers.onTouchStart},
  touchEnd: {type: 9, mappedToAbstractHandler: abstractHandlers.onTouchEnd},
  touchMove: {type: 10, mappedToAbstractHandler: abstractHandlers.onTouchMove},
  touchCancel: {type: 11},
  keyUp: {type: 12, mappedToAbstractHandler: abstractHandlers.onKeyUp},
  keyPress: {type: 13, mappedToAbstractHandler: abstractHandlers.onKeyPress},
  keyDown: {type: 14, mappedToAbstractHandler: abstractHandlers.onKeyDown},
  focus: {type: 15, mappedToAbstractHandler:  abstractHandlers.onFocus},
  blur: {type: 16, mappedToAbstractHandler: abstractHandlers.onBlur},
  scroll: {type: 17, mappedToAbstractHandler: abstractHandlers.onScroll},
  change: {type: 18, mappedToAbstractHandler: abstractHandlers.onChange}
};


/**
 * @_constructAbstractEventDirectlyFromTopLevel: helper function for the
 * simplest types of event handlers that require no special inference. (A click
 * is a click etc.)
 */
function _constructAbstractEventDirectlyFromTopLevel(topLevelEventType,
                                                     nativeEvent,
                                                     target) {
  var data;
  switch(topLevelEventType) {
    case topLevelEvents.mouseWheel:
      data = FEvent.normalizeAbstractMouseWheelEventData(nativeEvent, target);
      break;
    case topLevelEvents.scroll:
      data = FEvent._normalizeAbstractScrollEventData(nativeEvent, target);
      break;
    case topLevelEvents.click:
    case topLevelEvents.change:
    case topLevelEvents.mouseDown:
    case topLevelEvents.mouseUp:
    case topLevelEvents.touchMove:
    case topLevelEvents.touchStart:
    case topLevelEvents.touchEnd:
      data = FEvent._normalizeMouseData(nativeEvent, target);
      break;
    default:
      data = {};
  }

  return new AbstractEvent(
      topLevelEventType.mappedToAbstractHandler,
      topLevelEventType,
      target,
      nativeEvent,
      data);
}

FEvent = {
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
  DRAG_PIXEL_SAMPLE_RATE : 1,

  /* Will not fire drag events spaced further apart than 50 milliseconds.*/
  DRAG_TIME_SAMPLE_THRESH: 5,

  /* The number of pixels that are tolerated in between a touchStart and
   * touchEnd in order to still be considered a 'tap' event. */
  TAP_MOVEMENT_THRESHOLD : 10,

  /* This funny initialization is only needed so that browserify can reload
   * modules from a local cache. */
  abstractEventListenersById : {},

  /*
   * Key compression friendly event handler types. You can refer by key name,
   * and that will get minified. But we need a predictable schema to refer to
   * them at the system level because of the way the code is designed. It takes
   * a base name and needs to dynamically infer the associated Direct/First
   * Handler version as well. The way we'll do it for now, is give each base
   * type a number between 1-99 and add a "hundreds offset" for each "mode" of
   * handler (Direct/First Handler). Long term solution make an algorithm
   * intrinsically resilient to key compression.
   *
   * Keys will be minified, values are identities of those event handlers and
   * will not be minified. We can make assumptions about the values and use
   * *those* as the actual types.
   */
  abstractHandlers : abstractHandlers,

  /**
   * The various event modes and their respective offsets.
   */
  EventModes: {
    Default: 0,
    Direct: 100,
    FirstHandler: 200
  },

  preventDefaultOnNativeEvent: function(nativeEvent) {
    if(nativeEvent.preventDefault) {
      nativeEvent.preventDefault();
    } else {
      nativeEvent.returnValue = false;
    }
  },

  /**
   * The top level method that kicks off rendering to the dom should call this.
   */
  ensureListening: function(mountAt, touchInsteadOfMouse) {
    if (!FEvent.listeningYet) {
      FEvent.registerTopLevelListeners(mountAt, touchInsteadOfMouse);
      FEvent.listeningYet = true;
    }
  },

  /** Puts a particular event listener on the queue.  */
  enqueueEventReg: function(id, listener) {
    FEvent.abstractEventListenersById[
        id + "@" + listener.listenForAbstractHandlerType] = listener;
  },

  /**
   * Also performs the mapping from handler name to abstract event name.
   */
  registerHandlerByName : function(domNodeId, propName, handler) {
    if(FEvent.abstractHandlers[propName]) {
      FEvent.enqueueEventReg(domNodeId, {
        listenForAbstractHandlerType: FEvent.abstractHandlers[propName],
        callThis: handler
      });
    }
  },

  /**
   * @registerHandlers: Registers all applicable handlers.
   */
  registerHandlers : function(domNodeId, props) {
    var handlerName;
    for (handlerName in FEvent.abstractHandlers) {
      if (!FEvent.abstractHandlers.hasOwnProperty(handlerName)) {
        continue;
      }
      var handler = props[handlerName];
      if(handler) {
        FEvent.enqueueEventReg(domNodeId, {
            listenForAbstractHandlerType:
              FEvent.abstractHandlers[handlerName],
            callThis: handler
        });
      }
    }
  },

  /**
   * @trapCapturedEvent: Traps a top level event by using event capturing.
   */
  trapCapturedEvent:
      function(topLevelEventType, captureNativeEventType, onWhat) {
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
   * @trapBubbledEvent: Traps a top level event by using event bubbling.
   * Blatantly duplicating this event normalization code (same as
   * trapCapturedEvent) for performance reasons. Factoring out into helper
   * method would hurt a bit. This code is very critical to performance since it
   * is called very frequently.  http://jsperf.com/calling-function-vs-not
   * You'll also notice that we don't extensively normalize all of the event
   * data here, instead we normalize it as we need it (to save CPU).
   */
  trapBubbledEvent: function(topLevelEventType, windowHandlerName, onWhat) {
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
   * @_getTarget: x-browser normalization. Just inline this in critical
   * sections of code.
   */
  _getTarget: function(nativeEvent) {
    nativeEvent = nativeEvent || window.event;
    var targ  = nativeEvent.target || nativeEvent.srcElement;
    if (targ.nodeType === 3) { // defeat Safari bug
      targ = targ.parentNode;
    }
    return targ;
  },

  /*
   * @topLevelEventTypeIsUsableAsAbstract: Some top level events directly map to
   * an abstract handler type that a user of the event system would register.
   */
  topLevelEventTypeIsUsableAsAbstract: function(topLevelEventType) {
    return !!topLevelEventType.mappedToAbstractHandler;
  },

  /**
   * @dispatchAllAbstractEventsToListeners: Given a particular dom node id, a
   * mode of bubbling, and a list of abstract events that have occured at the
   * top level - dispatches accordingly.
   */
  dispatchAllAbstractEventsToListeners: function(id, mode, abstractEvents) {
    var i, foundOne = false, maybeEventListener = null, abstractEvent,
        abstractEventListenersById = FEvent.abstractEventListenersById;
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
   * procedure (meaning straight up to the top, not like mouseIn/Out).  It's
   * kind of funny how in the standard bubbling iteration we reason a lot about
   * drag handlers - never call them. Yet on mouse move or mouse ups type
   * handlers we don't even talk about bubbling. It's because all of the
   * bubbling (even for draggy events) were 'locked' in at the time of mouse
   * down (this function, actually).  Another interesting thing about this
   * function is that we infer high level onTouchTap events here. We never
   * "locked those in" at mouse down time though we could have.  The motive for
   * locking in mouse move events was performance. Why recalculate the exact
   * same bubble path on every pixel?  That would have been costly. But
   * onTouchTap shouldn't concern us - though it might be cleaner to lock it in
   * on mouse down - #todo (we should do this now because when there are
   * multiple fingers on the page, we need to know who started the touch down,
   * so that when we get a touchEnd event we can match it with the one that
   * started the touch.)
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
        abstractHandlers = FEvent.abstractHandlers,
        abstractEventListenersById = FEvent.abstractEventListenersById,
        mouseDownDragDesc = nextIdAt + (abstractHandlers.onDrag + mode),
        touchStartDragDesc = nextIdAt + (abstractHandlers.onTouchDrag + mode),
        mouseDownDragDoneDesc = nextIdAt + (abstractHandlers.onDragDone + mode),
        touchStartDragDoneDesc = nextIdAt +
            (abstractHandlers.onTouchDragDone + mode),
        dragDesc =
            topLevelEventType === topLevelEvents.mouseDown ? mouseDownDragDesc :
             topLevelEventType === topLevelEvents.touchStart ?
                touchStartDragDesc : false, // You won't be using it anyways.
        dragDoneDesc = topLevelEventType === topLevelEvents.mouseDown ?
              mouseDownDragDoneDesc :
              topLevelEventType === topLevelEvents.touchStart ?
                  touchStartDragDoneDesc: false; // Won't be using it anyways.

    var handledLowLevelEventByRegisteringDragListeners,
        handledLowLevelEventByFindingRelevantListeners = false;
    /** Lazily defined when we first need it. */
    var abstractEvents = [],
        newAbstractEvent,
        globalX,
        globalY;

    if (topLevelEventType === topLevelEvents.mouseDown ||
        topLevelEventType === topLevelEvents.touchStart) {

      globalX = FEvent.eventGlobalX(nativeEvent, true);
      globalY = FEvent.eventGlobalY(nativeEvent, true);
      FEvent.currentlyPressingDown = true;
      FEvent.lastTouchedDownAtX = globalX;
      FEvent.lastTouchedDownAtY = globalY;

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
          FEvent.activeDragListenersByListenerDesc[dragDesc] =
              abstractEventListenersById[dragDesc];
          FEvent.activeDragListenersCount++;
          var activeDragDoneListenerForNextId =
              abstractEventListenersById[dragDoneDesc];
          if (activeDragDoneListenerForNextId) {
            FEvent.activeDragDoneListenersByListenerDesc[dragDoneDesc] =
                activeDragDoneListenerForNextId;
            FEvent.activeDragDoneListenersCount++;
          }
          FEvent.lastTriggeredDragAtX = globalX; // not really, but works
          FEvent.lastTriggeredDragAtY = globalY;
          /* Setting this to zero, so that the very first drag event will never
           * be held back on account of the drag time. In fact it might be a
           * good idea to do something similar with the other two global
           * trackers (x/y) */
          FEvent.lastTriggeredDragAtTime = 0;
        }
      }
    } else if (topLevelEventType === topLevelEvents.touchEnd) {
      globalX = FEvent.eventGlobalX(nativeEvent);
      globalY = FEvent.eventGlobalY(nativeEvent);

      var totalDistanceSinceLastTouchedDown =
          Math.abs(globalX - FEvent.lastTouchedDownAtX) +
          Math.abs(globalY - FEvent.lastTouchedDownAtY);
      if (totalDistanceSinceLastTouchedDown < FEvent.TAP_MOVEMENT_THRESHOLD) {
        /* Code below will search for handlers that are interested in this
         * abstract event. */
        abstractEvents.push(new AbstractEvent(
            abstractHandlers.onTouchTap,
            topLevelEventType,
            targ,
            nativeEvent,
            {})
        );
      }
    }

    /*
     * We may have needed to register drag listeners, or infer touchTaps, but we
     * still might need those same top level event types that we used to call
     * handlers that are 'directly mapped' to those topLevelEvents. (such as
     * onTouchStart etc).
     */
    if (FEvent.topLevelEventTypeIsUsableAsAbstract(topLevelEventType)) {
      /*
       * Some abstract events are just simple one-one corresponding event types
       * with top level events.
       */
      abstractEvents.push(_constructAbstractEventDirectlyFromTopLevel(
          topLevelEventType, nativeEvent, targ));
    }

    handledLowLevelEventByFindingRelevantListeners =
        FEvent.dispatchAllAbstractEventsToListeners(
          nextId, mode, abstractEvents);

    return handledLowLevelEventByFindingRelevantListeners ||
           handledLowLevelEventByRegisteringDragListeners;
  },

  /* I <3 Quirksmode.org */
  _isNativeClickEventRightClick: function(nativeEvent) {
    return nativeEvent.which ? nativeEvent.which === 3 :
           nativeEvent.button ? nativeEvent.button === 3 :
           false;
  },

  /*
   * There are some normalizations that need to happen for various browsers. In
   * addition to replacing the general event fixing with a framework such as
   * jquery, we need to normalize mouse events here.  The below is mostly
   * borrowed from: jScrollPane/script/jquery.mousewheel.js
   */
  normalizeAbstractMouseWheelEventData: function(event /*native */, target) {
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
    if (orgEvent.wheelDeltaY !== undefined ) {
      deltaY = orgEvent.wheelDeltaY/120;
    }
    if (orgEvent.wheelDeltaX !== undefined ) {
      deltaX = -1*orgEvent.wheelDeltaX/120;
    }

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
   * Note: for touchEnd the touches will usually be empty, or not what you would
   * think they are. Just don't rely on them for handling touchEnd events.
   * http://stackoverflow.com/questions/3666929/
   * mobile-sarai-touchend-event-not-firing-when-last-touch-is-removed We're
   * usually only interested in single finger gestures or mouse clicks, which is
   * why we only care about touches of length 1.  We can extract more
   * interesting gesture patterns later.
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
      globalX: FEvent.eventGlobalX(event),
      globalY: FEvent.eventGlobalY(event),
      rightMouseButton: FEvent._isNativeClickEventRightClick(event)
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

  /**
   * @_handleMouseInOut: Well need to handle all events that have either a from
   * or to starting with a '.'.  This should be the first thing checked at the
   * top.  We only need to handle mouse out events, as we can always infer the
   * mouse in event.  If we handle both, we get duplicate events firing. todo:
   * All of this would be faster if I just used string.split('.'); todo: These
   * mouseIn and mouseOut events should be inferred at the high level event
   * inference stage of the event processing pipeline. However, it's tough,
   * because there are N x M high level events that occurred. Maybe high level
   * events just contain a succinct description of what physically happened, and
   * the dispatcher is smart enough to know how to dispatch this to all
   * concerned parties. When plugging into the event system, One would only need
   * to write the extracter and the dispatcher. todo: mouseIn and out have
   * different types of bubbling. The mouse can jump lineage, from the 'from'
   * branch to the 'to' branch. We perform special bubbling from the from to the
   * common ancestor triggering the mouse out event.  We do not bubble any
   * further. (Similarly for mouse in). Ever person along that path has the
   * opportunity to handle the mouseIn/out and no one has the ability to top the
   * propagation or specify that they aren't interested in bubbled events.  The
   * 'out' event occurred just as much on every single element in the from path
   * to the common ancestor. (Similarly with 'to').
   */
  _handleMouseInOut: function(topLevelEventType, nativeEvent, targ) {
    var to = targ, from = targ, fromId = '', toId = '',
        abstractEventListenersById = FEvent.abstractEventListenersById;

    if (topLevelEventType === topLevelEvents.mouseIn) {
      from = nativeEvent.relatedTarget || nativeEvent.fromElement;
      if (from) {
        return; /* Listening only to mouse out events can catch all except
                 * mousing from outside window into the document. Otherwise
                 * we'll listen only for mouse outs.*/
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
    /* Nothing pertains to our managed components. */
    if (!from && !to) { return; }
    if (from && from.id) { fromId = from.id; }
    if (to && to.id) { toId = to.id; }
    var commonIdx = 0;

    /* Stays this way if one of from/to is window. */
    var commonAncestorId = '';
    var commonChars = 0;
    while (toId.charAt(commonChars) !== '' &&
           fromId.charAt(commonChars) !== '' &&
           toId.charAt(commonChars) === fromId.charAt(commonChars)) {
      /* Find last common dot (with virtual dots at the end of the from/to) */
      commonChars++;
    }
    /* could use either to or from - they're in common! */
    if (toId.charAt(commonChars-1) === '.') {
      commonAncestorId = toId.substr(0, commonChars - 1); // remove the dot
    } else {
      /* Some cases that can happen
       * a.b.something a.b.some
       * a.b.something a.b.something.else
       * a.b.c.something a.b.canyouhearme
       * Use two without loss of generality.*/
      commonAncestorId = toId.substr(
        0, (toId.substr(0, commonChars)).lastIndexOf('.')
      );
    }

    var i, maybeEventListener, traverseId = fromId;
    if (from) {
      i = 0;
      while (traverseId !== commonAncestorId) {
        maybeEventListener = abstractEventListenersById[
            traverseId + '@' + FEvent.abstractHandlers.onMouseOut
        ];
        if (maybeEventListener) {
          maybeEventListener.callThis(
            new AbstractEvent(
                FEvent.abstractHandlers.onMouseOut,
                topLevelEventType, targ, nativeEvent, {}),
                targ, nativeEvent);
        }
        var oldtrav = traverseId;
        traverseId = traverseId.substr(0, traverseId.lastIndexOf('.'));
        i++;
        if (i > 200 ) {
          FEvent.Error('Runaway tree: ' + traverseId);
          return;
        }
      }
    }

    /* todo: should not trigger on common ancestor. */
    traverseId = toId.substr(0, commonAncestorId.length);
    if (to) {
      i = 0;
      while (traverseId !== toId) {
        traverseId = toId.indexOf('.', traverseId.length +1) === -1 ? toId :
          toId.substr(0, (toId.indexOf('.', traverseId.length+1)));
        maybeEventListener = abstractEventListenersById[
            traverseId + '@' + FEvent.abstractHandlers.onMouseIn];
        if (maybeEventListener) {
          maybeEventListener.callThis(
            new AbstractEvent(
              FEvent.abstractHandlers.onMouseIn,
              topLevelEventType,
              nativeEvent,
              {}
            ),
            targ,
            nativeEvent
          );
        }
        i++;
        if (i > 200 ) {
          FEvent.Error('Runaway tree: ' + traverseId);
          return;
        }
      }
    }
    return;
  },

  /**
   * @handleMovementyTopLevelEvent: Handles events that are 'movementy', meaning
   * mouse and touch drags, not mouse in or out events which are more
   * instantaneous in nature occurring at element boundaries and thus don't need
   * the same quantization as movementy events.  From these top level movementy
   * events we can infer (currently) two higher level events (both drag events)
   * (onTouchDrag and onDrag)
   */
  handleMovementyTopLevelEvent: function(topLevelEventType, nativeEvent, targ) {
    if (!FEvent.currentlyPressingDown) {
      return;
    }

    var globalX, globalY, dragDesc, totalDistanceSinceLastDrag,
        nowMs, totalMsSinceLastDrag;

    globalX = FEvent.eventGlobalX(nativeEvent);
    globalY = FEvent.eventGlobalY(nativeEvent);


    if (FEvent.activeDragListenersCount) {
      /* Not distance, but sum of deltas along both dimensions */
      totalDistanceSinceLastDrag =
          Math.abs(globalX - FEvent.lastTriggeredDragAtX) +
          Math.abs(globalY - FEvent.lastTriggeredDragAtY);

      nowMs = (new Date()).getTime();
      totalMsSinceLastDrag = nowMs - FEvent.lastTriggeredDragAtTime;

      if(totalDistanceSinceLastDrag < FEvent.DRAG_PIXEL_SAMPLE_RATE ||
         totalMsSinceLastDrag < FEvent.DRAG_TIME_SAMPLE_THRESH) {
        return;
      }

      /* Okay, the active drag handlers bank could have either touched drag or
       * regular drag handlers, but practically you'll never be running in a
       * context where the two types could simultaneously exist - we don't need
       * to check their types - in fact we could consolidate this into a
       * conceptual onAnyDrag event early on.  */
      for (dragDesc in FEvent.activeDragListenersByListenerDesc) {
        if (!FEvent.
            activeDragListenersByListenerDesc.hasOwnProperty(dragDesc)) {
          continue;
        }
        var abstractEventData = FEvent._normalizeAbstractDragEventData(
            nativeEvent, globalX, globalY,
            FEvent.lastTouchedDownAtX,
            FEvent.lastTouchedDownAtY),
            listener = FEvent.activeDragListenersByListenerDesc[dragDesc];

        var abstractEvent = new AbstractEvent(
          topLevelEventType === topLevelEvents.touchMove ?
              abstractHandlers.onTouchDrag :
              abstractHandlers.onDrag,
          topLevelEventType,
          targ, nativeEvent, abstractEventData);
        listener.callThis.call(
          listener.context || null, abstractEvent, nativeEvent
        );
      }
      FEvent.lastTriggeredDragAtX = globalX;
      FEvent.lastTriggeredDragAtY = globalY;
      FEvent.lastTriggeredDragAtTime = nowMs;
    }
  },

  /**
   * @_handleLetUppyTopLevelEvent: Handles events that are of the "let up"
   * nature, meaning a mouseup/touchup, but this also gives us an opportunity to
   * infer a higher level event onTouchTap (which is a touchStart followed by
   * not much movement followed by a touchEnd). We don't need to immediately
   * track the originating element that was toucheStarted upon because no
   * movement occured - except in the case where the touchStart hides the
   * element, no movement occurs then a touchEnd is observed. (We can fix that
   * if it becomes an issue.)
   */
  _handleLetUppyTopLevelEvent: function(topLevelEventType, nativeEvent, targ) {
    var globalX, globalY, dragDoneDesc,
        totalDistanceSinceLastTouchedDown, totalDistanceSinceLastDrag,
        activeDragDoneListenerForDragDesc;

    globalX = FEvent.eventGlobalX(nativeEvent);
    globalY = FEvent.eventGlobalY(nativeEvent);


    totalDistanceSinceLastTouchedDown =
        Math.abs(globalX - FEvent.lastTouchedDownAtX) +
        Math.abs(globalY - FEvent.lastTouchedDownAtY);

    if (FEvent.activeDragDoneListenersCount) {
      /* Only trigger the dragDone event if there has been some mouse movement
       * while the mouse was depressed (at same quantizeDrag threshold
       * (FEvent.DRAG_PIXEL_SAMPLE_RATE))*/
      if(totalDistanceSinceLastTouchedDown > FEvent.DRAG_PIXEL_SAMPLE_RATE) {
        for (dragDoneDesc in FEvent.activeDragDoneListenersByListenerDesc) {
          if (!FEvent.activeDragDoneListenersByListenerDesc.
               hasOwnProperty(dragDoneDesc)) {
            continue;
          }
          activeDragDoneListenerForDragDesc =
              FEvent.activeDragDoneListenersByListenerDesc[dragDoneDesc];
          var abstractEvent = new AbstractEvent(
              topLevelEventType === topLevelEvents.mouseUp ?
                  abstractHandlers.onDragDone :
                  abstractHandlers.onTouchDragDone,
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
     * we need to remember the initial event that instigated the drag. That will
     * also make handling single taps easier - see the main top level handler
     * (we had to handle letUppy events very last because bubbling needed
     * certain data that it cleared.) Doing this right will be harder than it
     * sounds - we're talking about multiple drag events. That would require
     * that when multiple touches occur, and multiple touchmoves occur that we
     * track which originating objects should receive which signal channel for
     * touch events. Maybe the browser helps us out with this?
     */
    FEvent.activeDragListenersByListenerDesc = {};
    FEvent.currentlyPressingDown = false;
    FEvent.activeDragListenersCount = 0;
    FEvent.activeDragDoneListenersCount = 0;
    FEvent.activeDragDoneListenersByListenerDesc = {};
    FEvent.lastTouchedDownAtX = 0;
    FEvent.lastTouchedDownAtY = 0;
  }
};


/**
 * @registerDocumentScrollListener: The F system needs to listen to document
 * scroll events to update the single point of inventory on the document's
 * currently scrolled to position. The idea is that there's a single point
 * where this is maintained and always kept up to date. Anyone who wants to
 * know that value should as the FEnv what the latest value is. If everyone
 * queried the document when they wanted to know the value, they'd trigger
 * reflows like mad. I don't think we needed to normalize the target here.
 * Check this on safari etc - we only care about one very specific event on a
 * very specific target - as long as it works for that case.  TODO: Make
 * resizing recalculate these as well.
 */
FEvent.registerDocumentScrollListener = function() {
  var previousDocumentScroll = document.onscroll;
  document.onscroll = function(nativeEvent) {
    if(nativeEvent.target === document) {
      FEnv.refreshAuthoritativeScrollValues();
    }
    if(previousDocumentScroll) { previousDocumentScroll(nativeEvent); }
    if (FEvent.applicationDocumentScrollListener) {
      FEvent.applicationDocumentScrollListener(nativeEvent);
    }
  };
};

/**
 * Default resize batching time is zero (n/a) but you can set this to whatever
 * ms you want elapsed in between firing application registered resize events.
 * If you reset the FEnv's knowledge of viewport dimensions on every resize, you
 * could be causing an entirely new reflow.
 */
FEvent.applicationResizeBatchTimeMs = 0;
FEvent.registerWindowResizeListener = function() {
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
          if (FEvent.applicationResizeListener) {
            FEvent.applicationResizeListener(nativeEvent);
          }
          pendingCallback = false;
          lastMs = now;
        }, Math.max(FEvent.applicationResizeBatchTimeMs - ellapsed + 1, 1));
      return; // Don't trigger a reflow by querying for the window dimensions
    }
  };
};

/**
 * This is just for IE only. For other browsers, we can easily apply a noselect
 * class. In IE we need to inspect every element that was selected and see if it
 * had a noselect class on it :( This also deactivates that horrible horrible
 * horrible horrible "accelerator" popups on IE8.  This needs to be rethought,
 * for a couple of reasons - first being that key minification can ruin any
 * class name we might be looking for. The second, is this will prevent less
 * than what non-ie browsers with noSelect will catch. I think the best
 * solution, would be to apply a single global listener to
 * document.onselectstart when in the process of a drag, which prevents default,
 * and detach that listener on drag done.  @deprecated - use
 * @disableSelectionGlobally when you have drag events that you want to avoid
 * selection with.
 */
FEvent.registerIeOnSelectStartListener = function() {
  var previousOnSelectStart = document.onselectstart;
  document.onselectstart = function(nativeEvent) {
    var targ = FEvent._getTarget(nativeEvent);
    if (targ.className && targ.className.search(/noSelect/) !== -1 ) {
      (nativeEvent || window.event).returnValue = false;
    }
    if (previousOnSelectStart) {
      previousOnSelectStart(nativeEvent || window.event);
    }
  };
};

/**
 * @disableSelectionGlobally: Ensures that selection of document elements is
 * disabled temporarily. When calling the complementary method
 * enableSelectionGlobally, it will restore the old handler.  Todo: Firefox
 * support (by returning false on mousedowns during drags) Note: We use
 * 'onselectstart' in string form so that closure compiler doesn't eliminate it
 * -which is odd since Chrome actually supports that event.
 */
FEvent.disableSelectionGlobally = function() {
  if (FEvent.haveBackedUpOldOnSelectStart) {
    return;
  }
  FEvent.oldOnSelectStart = document['onselectstart'];
  FEvent.haveBackedUpOldOnSelectStart = true;
  document['onselectstart'] = function(nativeEvent) {
    FEvent.preventDefaultOnNativeEvent(nativeEvent || window.event);
  };
};

FEvent.enableSelectionGlobally = function() {
  if (FEvent.haveBackedUpOldOnSelectStart) {
    document['onselectstart'] = FEvent.oldOnSelectStart;
    FEvent.oldOnSelectStart = null;
    FEvent.haveBackedUpOldOnSelectStart = false;
  }
};

/**
 * @startsWith: Little optimization. We'll put something like this in Utils, and
 * fall back to either a compiled regex, or the following algorithm, depending
 * on which is faster on which browser.
 */
function startsWith(str, startsWithStr) {
  var i;
  for (i=0; i < startsWithStr.length; i=i+1) {
    if (str[i] !== startsWithStr[i]) {
      return false;
    }
  }
  return true;
}

/**
 * @releaseMemoryReferences: Releases memory in a controlled manner. Once
 * artifacts are removed from the DOM, simply removing any event handlers in the
 * top level bank should be the last thing needed to clear memory.
 *
 * This particular algorithm will be very slow if you wait too long until
 * clearing memory.  You may set up a window timeOut to clear memory every
 * second or so, but your application likely has a particular moments of
 * interest when you know it's most beneficial to clear memory. Choose those
 * times, and eliminate any master timeOut when in those application flows.
 *
 * Try: Let's test a tree hierarchy for event listeners, so in a single
 * statement we can clear out all child dependency listeners.
 *
 * Also: using top level event delegation in the more traditional manner (one
 * handler for several instances will make this cleanup process very very fast.)
 * Since we don't want to push the burden of thinking about that onto the
 * developer, we'll hold off until our static analysis (or api) is robust enough
 * to accommodate those patterns.
 */
FEvent.releaseMemoryReferences = function(idPrefixes) {
  var i, idPrefix, listenerDesc,
      abstractListeners = FEvent.abstractEventListenersById;

  for (idPrefix in idPrefixes) {
    if (!idPrefixes.hasOwnProperty(idPrefix)) {
      continue;
    }
    for (listenerDesc in abstractListeners) {
      if (!abstractListeners.hasOwnProperty(listenerDesc)) {
        continue;
      }
      /*
       * Need to avoid accidentally deleting .top.thing.key11 when we are
       * searching by prefix .top.thing.key1. Searching by prefix (with dot at
       * the end) finds all handlers that are on dom elements that are
       * descendants of the prefix element. The '@' symbol will catch any events
       * registered on elements that have an id exactly equal to the prefix.
       */
      if (startsWith(listenerDesc, idPrefix) &&
          (listenerDesc.charAt(idPrefix.length) === '.' ||
            listenerDesc.charAt(idPrefix.length) === '@')) {
        delete abstractListeners[listenerDesc];
      }
    }
  }
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

FEvent.registerTopLevelListeners = function(mountAt, touchInsteadOfMouse) {
  FEvent.registerDocumentScrollListener();
  FEvent.registerWindowResizeListener();
  /* @deprecated: FEvent.registerIeOnSelectStartListener(); */

  /*
   * #todoie: onmouseover/out do not work on the window element on IE*, will
   * likely need to capture using addEventListener/attachEvent.
   */
  if (!touchInsteadOfMouse) {
    FEvent.trapBubbledEvent(topLevelEvents.mouseMove, 'onmousemove', document);
    FEvent.trapBubbledEvent(topLevelEvents.mouseIn, 'onmouseover',
                            mountAt || document);
    FEvent.trapBubbledEvent(topLevelEvents.mouseDown, 'onmousedown',
                            mountAt || document);
    FEvent.trapBubbledEvent(topLevelEvents.mouseUp, 'onmouseup', document);
    FEvent.trapBubbledEvent(topLevelEvents.mouseOut, 'onmouseout',
                            mountAt || document);
    FEvent.trapBubbledEvent(topLevelEvents.click, 'onclick',
                            mountAt || document);
    FEvent.trapBubbledEvent(topLevelEvents.mouseWheel, 'onmousewheel',
                            mountAt || document);
  } else {
    FEvent.trapBubbledEvent(topLevelEvents.touchStart, 'ontouchstart',
                            document);
    FEvent.trapBubbledEvent(topLevelEvents.touchEnd, 'ontouchend', document);
    FEvent.trapBubbledEvent(topLevelEvents.touchMove, 'ontouchmove', document);
    /* Todo: handle touchcancel */
    FEvent.trapBubbledEvent(topLevelEvents.touchCancel,
                            'ontouchcancel', document);

  }

  /*
   * #todoie: Supposedly, keyup/press/down won't bubble to window on ie, but
   * will bubble to document. Maybe we should just trap there.
   * http://www.quirksmode.org/dom/events/keys.html.
   */
  FEvent.trapBubbledEvent(topLevelEvents.keyUp, 'onkeyup', mountAt || document);
  FEvent.trapBubbledEvent(
      topLevelEvents.keyPress, 'onkeypress', mountAt || document);
  FEvent.trapBubbledEvent(
      topLevelEvents.keyDown, 'onkeydown', mountAt || document);

  FEvent.trapBubbledEvent(topLevelEvents.change, 'onchange',
                          mountAt || document);


  /* http://www.quirksmode.org/dom/events/tests/scroll.html (Firefox needs to
   * capture a diff mouse scroll); No browser captures both simultaneously so
   * we're good */
  FEvent.trapCapturedEvent(
      topLevelEvents.mouseWheel, 'DOMMouseScroll', mountAt || document);
  FEvent.trapCapturedEvent(
      topLevelEvents.scroll, 'scroll', mountAt || document);

  /*
   * IE has focusin and focusout which bubble which we have to use because we
   * can't use event capturing in IE8 and below. No other browsers besides IE
   * support these events, so we must capture them at the top level.
   *
   * See: http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
   */
  FEnv.ensureBrowserDetected();
  if (FEnv.browserInfo.browser === 'Explorer' &&
      '' + FEnv.browserInfo.version !== '9' &&
      '' + FEnv.browserInfo.version !== '10') {
    FEvent.trapBubbledEvent(topLevelEvents.focus, 'onfocusin', document);
    FEvent.trapBubbledEvent(topLevelEvents.blur, 'onfocusout', document);
  } else {
    FEvent.trapCapturedEvent(topLevelEvents.focus, 'focus', mountAt || window);
    FEvent.trapCapturedEvent(topLevelEvents.blur, 'blur', mountAt || window);
  }
};


/**
 * @_handleTopLevel: Tests for the most time sensitive events first to get them
 * out of the way (we don't need any additional slow down when dispatching
 * scroll/mousemove events.  There's a couple different ways to handle the
 * events, and we try to get the most time sensitive out of the way first. The
 * overall approach is that for any given low level (top level) event type, the
 * system may need to accumulate state, and/or construct an array of "abstract"
 * event types (which are the type of events that components can actually listen
 * to.) Some of the time sensitive handlers (handleMovementyTopLevelEvent) only
 * try to construct a single abstractEvent and find a listener for it, but I'd
 * like the entire process to become unified. It is the way it is now, mostly
 * because it's relatively fast to do.  A really solid abstract event extraction
 * system is difficult but should look like the following:
 * Low level events =>
 *  (plugins defining a query on low level event stream, in addition to being
 *  able to store/clear global accumulated state)
 *  => construct an array of inferred abstract events
 *  => call listeners
 *  The main problem with this, is that certain events like mouse in/outs need
 *  (or at least I saw the need for) a unique bubbling process.
 */
function _handleTopLevel(topLevelEventType, nativeEvent, targ) {
  var nextId = targ.id;
  if (topLevelEventType === topLevelEvents.mouseMove) {
    FEvent.handleMovementyTopLevelEvent(topLevelEventType, nativeEvent, targ);
    return;
  }
  /* Return for mousemove because we don't yet support handling those native
   * events directly - let's support onTouchMove directly, however - won't
   * return*/
  if (topLevelEventType === topLevelEvents.touchMove) {
    FEvent.handleMovementyTopLevelEvent(topLevelEventType, nativeEvent, targ);
  }

  /* Now we begin the bubbling process! Get first dom node with a registered
   * id. */
  while (targ.parentNode && targ.parentNode !== targ &&
      (nextId === null || nextId.length === 0)) {
    targ = targ.parentNode;
    nextId = targ.id;
  }

  /** There is no touch analog to this. */
  if (topLevelEventType === topLevelEvents.mouseIn ||
      topLevelEventType === topLevelEvents.mouseOut) {
    FEvent._handleMouseInOut(topLevelEventType, nativeEvent, targ);
    return;
  }

  /*
   * We don't currently have a good way to tell the event system to "stop
   * bubbling". In fact, that somewhat breaks encapsulation. Parents have the
   * option, instead, to declare that they are interested in events that have
   * not been bubbled up, or events that may/may not have been bubbled, or,
   * optionally, anything that has may or may not have been bubbled yet has not
   * yet been handled by any contained elements.  Currently, we'll have two
   * modes, 'direct' and default (which encompasses direct events and bubbled).
   * Not yet implemented explicitly specifying that events must be indirect.
   */
  var handledYet = false;
  if(nextId && nextId.length !== 0) {
    handledYet = FEvent.standardBubblingIteration(
        nextId,
        topLevelEventType,
        FEvent.EventModes.Direct,
        nativeEvent,
        targ);
  }


  /*
   * Interesting subtlety. If a click is handled by a lower level, then a drag
   * does not count as a 'firstHandler'. I think that makes sense but might come
   * as a surprise.
   */
  while(nextId && nextId.length !== 0) {
    if (!handledYet) {
      handledYet = FEvent.standardBubblingIteration(
          nextId,
          topLevelEventType,
          FEvent.EventModes.FirstHandler,
          nativeEvent,
          targ);
    }
    handledYet = FEvent.standardBubblingIteration(
      nextId,
      topLevelEventType,
      FEvent.EventModes.Default,
      nativeEvent,
      targ) || handledYet; // Important that this || be on the end, not beg
    var lastIndexDot = nextId.lastIndexOf(".");
    // still works even if lastIndexDot is -1
    nextId = nextId.substr(0, lastIndexDot);
  }

  /* This needs to occur last because it resets global information such as the
   * touched down location which the standard bubbling needs. Once we put
   * touchTap inference into the "lock down" phase of onTouchStart (in bubbling)
   * we could probably end up moving this back - if we trap all info needed at
   * that point.*/
  if (topLevelEventType === topLevelEvents.mouseUp ||
      topLevelEventType === topLevelEvents.touchEnd ||
      topLevelEventType === topLevelEvents.touchCancel) {
    FEvent._handleLetUppyTopLevelEvent(topLevelEventType, nativeEvent, targ);
    /* Don't return here because the mouse up event might need to be handled in
     * it's own right - _handleLetUppyTopLevelEvent only is used to infer very
     * high level events that involve accumulated state(such as drags etc) but
     * we'll still allow the low level ones as well.*/
  }

}

module.exports = FEvent;

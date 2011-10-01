var FEnv = require('./FEnv');

/**
 * Helper class. Provides a nicer api for a conceptual 'event'. Eliminates some
 * cross-browser inconsistencies. In the future, continue to place x-browser
 * event normalization here if possible, and it applies to all events.
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


/**
 * Fax events module.
 */
var FaxEvent = {
  /**
   * The event system keeps track of some global state, in order to infer
   * abstract events that occur over a sequence of more than one top level
   * event. The 'active' drag handlers are handlers that are currently active
   * and should receive drag signals when the mouse is used. The bubbling has
   * already occured at the time of mouse down and the set of registered drag
   * handlers have been stored in these global sets.
   */
  activeDragHandlersByHandlerDesc : {},
  activeDragHandlersCount : 0,
  activeDragDoneHandlersByHandlerDesc : {},
  activeDragDoneHandlersCount: 0,
  startedDraggingAtX : null,
  startedDraggingAtY : null,
  lastTriggeredDragAtX : null,
  lastTriggeredDragAtY : null,
  listeningYet: false,

  /* This funny initialization is only needed so that browserify can reload
   * modules from a local cache. */
  abstractEventHandlersById :
      typeof FaxEvent === 'object'  ? FaxEvent.abstractEventHandlersById : {},

  /* To be populated */
  abstractHandlerNames : {},

  /**
   * The top level method that kicks off rendering to the dom should call this.
   */
  ensureListening: function(mountAt) {
    if (!FaxEvent.listeningYet) {
      FaxEvent.registerTopLevelListener(mountAt);
      FaxEvent.listeningYet = true;
    }
  },

  /** Puts a particular event listener on the queue.  */
  enqueueEventReg : function (id, listener) {
    FaxEvent.abstractEventHandlersById[
        id + "@" + listener.listenForAbstractHandlerName] = listener;
  },

  /**
   * Also performs the mapping from handler name to abstract event name.
   */
  registerHandlerByName : function(domNodeId, propName, handler) {
    if(FaxEvent.abstractHandlerNames[propName]) {
      FaxEvent.enqueueEventReg(domNodeId, {
        listenForAbstractHandlerName: propName,
        callThis: handler
      });
    }
  },

  /**
   * Also performs the mapping from handler name to abstract event name.
   */
  registerHandlers : function(domNodeId, props) {
    for (var handlerName in FaxEvent.abstractHandlerNames) {
      if (!FaxEvent.abstractHandlerNames.hasOwnProperty(handlerName)) {
        continue;
      }
      var handler = props[handlerName];
      if(handler) {
        FaxEvent.enqueueEventReg(domNodeId, {
            listenForAbstractHandlerName: handlerName,
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
      var nativeEvent  = nativeEvent || window.event;
      var targ  = nativeEvent.target || nativeEvent.srcElement;
      if (targ.nodeType === 3) { // defeat Safari bug
        targ = targ.parentNode;
      }
      return targ;
  },

  /**
   * In terms of event base names (not including 'Direct' etc.)
   */
  topLevelEventTypesDirectlyMappedToAbstractHandlerName: {
    topLevelClick: 'onClick',
    topLevelMouseWheel: 'onMouseWheel',
    topLevelMouseScroll: 'onMouseScroll',
    topLevelKeyUp: 'onKeyUp',
    topLevelKeyDown: 'onKeyDown',
    topLevelKeyPress: 'onKeyPress',
    topLevelFocus: 'onFocus',
    topLevelBlur: 'onBlur',
    topLevelMouseDown: 'onMouseDown',
    topLevelTouchStart: 'onTouchStart',
    topLevelMouseUp: 'onMouseUp'
  },

  topLevelEventTypeHasCorrespondingAbstractType: function(topLevelEventType) {
    return !!FaxEvent.topLevelEventTypesDirectlyMappedToAbstractHandlerName[
          topLevelEventType];
  },

  /**
   * Triggers any registered events on an id as part of a very regular bubbling
   * procedure (meaning straight up to the top, not like mouseIn/Out).
   * @mode: Such as 'Direct' or 'FirstHandler'.
   * @returns whether or not the event was handled by the dom node with this id
   */
  standardBubblingIteration: function(nextId,
                                      topLevelEventType,
                                      mode,
                                      nativeEvent,
                                      targ) {
    var abstractEventHandlersById = FaxEvent.abstractEventHandlersById;
    var dragDesc = nextId + '@onQuantizeDrag' + mode;
    var somethingHandledThisLowLevelEvent = false;
    /** Lazily defined when we first need it. */
    var abstractEvent;
    if (topLevelEventType === 'topLevelMouseDown' && abstractEventHandlersById[dragDesc]) {
      abstractEvent = _constructAbstractEventDirectlyFromTopLevel(
          topLevelEventType,
          nativeEvent,
          targ);
      /* even if nothing handles the mouse down, and something handles the
       * click, we say that anything above this in the dom tree will not be the
       * first handler, whether or not they're listening for clicks/drags. We
       * can eventually change that to care about what exactly was handled, but
       * this is kind of convenient.*/
      if(!abstractEvent.data.rightMouseButton) {
        somethingHandledThisLowLevelEvent = true;
        var dragDoneDesc = nextId + '@onDragDone' + mode;
        var pageX = FaxEvent.eventGlobalX(nativeEvent);
        var pageY = FaxEvent.eventGlobalY(nativeEvent);
        FaxEvent.activeDragHandlersByHandlerDesc[dragDesc] =
            abstractEventHandlersById[dragDesc].callThis;
        FaxEvent.activeDragHandlersCount++;
        var activeDragDoneHandlerForNextId =
            abstractEventHandlersById[dragDoneDesc];
        if (activeDragDoneHandlerForNextId) {
          FaxEvent.activeDragDoneHandlersByHandlerDesc[dragDoneDesc] =
              activeDragDoneHandlerForNextId.callThis;
          FaxEvent.activeDragDoneHandlersCount++;
        }
        FaxEvent.startedDraggingAtX = pageX;
        FaxEvent.startedDraggingAtY = pageY;
        FaxEvent.lastTriggeredDragAtX = pageX; // not really, but works
        FaxEvent.lastTriggeredDragAtY = pageY;
      }
    }


    /**
     * Some abstract events are just simple one-one corresponding event types
     * with top level events.
     */
    if (FaxEvent.topLevelEventTypeHasCorrespondingAbstractType(topLevelEventType)) {
      abstractEvent = typeof abstractEvent !== 'undefined' ?
          abstractEvent :
          _constructAbstractEventDirectlyFromTopLevel(
              topLevelEventType, nativeEvent, targ); 

      var maybeEventListener = abstractEventHandlersById[
              nextId + "@" + abstractEvent.abstractEventType + mode];
      if (maybeEventListener) {
        maybeEventListener.callThis(abstractEvent, nativeEvent);
        somethingHandledThisLowLevelEvent = true;
      }
    }
    return somethingHandledThisLowLevelEvent;
  },

  /** I <3 Quirksmode.org */
  _isNativeClickEventRightClick: function(nativeEvent) {
    return nativeEvent.which ? nativeEvent.which == 3 :
           nativeEvent.button ? nativeEvent.button == 3 :
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
    event.type = "mousewheel";

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

  eventGlobalY: function(event) {
    return event.pageY !== undefined ? event.pageY :
                event.clientY + FEnv.currentScrollTop;
  },
  eventGlobalX: function(event) {
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
                                            startedDraggingAtX,
                                            startedDraggingAtY) {
    return {
      globalX: globalX, globalY: globalY,
      startX: startedDraggingAtX, startY: startedDraggingAtY
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
        abstractEventHandlersById = FaxEvent.abstractEventHandlersById;

    if (topLevelEventType === 'topLevelMouseIn') {
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
        maybeEventListener = abstractEventHandlersById[traverseId + "@onMouseOut"];
        if (maybeEventListener) {
          maybeEventListener.callThis(
              new AbstractEvent('onMouseOut', topLevelEventType, nativeEvent, {}),
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
        maybeEventListener = abstractEventHandlersById[traverseId + "@onMouseIn"];
        if (maybeEventListener) {
          maybeEventListener.callThis(
              new AbstractEvent('onMouseIn', topLevelEventType, nativeEvent, {}),
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
   * Todo, pass an instance of AbstractEvent to the handler with coords inside
   * of the 'data' attribute (consistency).
   */
  _handleMouseMove: function(nativeEvent, targ) {
    /* Arbitrarily choose 3 as the required delta - easy to customize later.
     * Mouse move events can trigger huge propagations in ui appearance and it's
     * nice to be able to only do this occasionally. We'll offer two things, 1.
     * Custom sample rate, 2. adaptive sampling - sample less when each signal
     * takes a longer amount of time to respond to - trailing average. */
    var SAMPLE_RATE = 10;
    if (FaxEvent.activeDragHandlersCount) {
      var globalX = FaxEvent.eventGlobalX(nativeEvent);
      var globalY = FaxEvent.eventGlobalY(nativeEvent);

      if(Math.abs(globalX - FaxEvent.lastTriggeredDragAtX) +
            Math.abs(globalY - FaxEvent.lastTriggeredDragAtY) < SAMPLE_RATE) {
        return;
      }
      for (var dragDesc in FaxEvent.activeDragHandlersByHandlerDesc) {
        if (!FaxEvent.activeDragHandlersByHandlerDesc.hasOwnProperty(dragDesc)) {
          continue;
        }

        var abstractEventData = FaxEvent._normalizeAbstractDragEventData(
            nativeEvent, globalX, globalY,
            FaxEvent.startedDraggingAtX,
            FaxEvent.startedDraggingAtY);

        var abstractEvent = new AbstractEvent(
          'onQuantizeDrag', 'topLevelMouseMove',
          targ, nativeEvent, abstractEventData);
        FaxEvent.activeDragHandlersByHandlerDesc[dragDesc](abstractEvent);
      }
      FaxEvent.lastTriggeredDragAtX = globalX;
      FaxEvent.lastTriggeredDragAtY = globalY;
    }
  },

  _handleMouseUp: function(nativeEvent, targ) {
    var SAMPLE_RATE = 3;
    var pageX = nativeEvent.pageX;
    var pageY = nativeEvent.pageY;
    if (FaxEvent.activeDragDoneHandlersCount) {
      /* Only trigger the dragDone event if there has been some mouse movement
       * while the mouse was depressed (at same quantizeDrag threshold
       * (SAMPLE_RATE))*/
      if(Math.abs(pageX - FaxEvent.startedDraggingAtX) +
            Math.abs(pageY - FaxEvent.startedDraggingAtY) > SAMPLE_RATE) {
        for (var dragDoneDesc in FaxEvent.activeDragDoneHandlersByHandlerDesc) {
          if (!FaxEvent.activeDragDoneHandlersByHandlerDesc.hasOwnProperty(dragDoneDesc)) {
            continue;
          }
          FaxEvent.activeDragDoneHandlersByHandlerDesc[dragDoneDesc]();
        }
      }
    }
    FaxEvent.activeDragHandlersByHandlerDesc = {};
    FaxEvent.activeDragHandlersCount = 0;
    FaxEvent.activeDragDoneHandlersCount = 0;
    FaxEvent.activeDragDoneHandlersByHandlerDesc = {};
    FaxEvent.startedDraggingAtX = 0;
    FaxEvent.startedDraggingAtY = 0;
  }
};

/**
 * empty string: Default - events bubble, children have no way to stop them.
 * 'Direct': Only if the handler belong to the deepest element in the managed id
 *           space that is being interacted with.
 * 'FirstHandler': Only if no deeper element has handled this event.
 * You may notice that the abstract event types overlap with the top level
 * event types. An abstract event is an occurrence of interest which may or may
 * not correspond to a top level event. We may accept a top level event and
 * potentially extract from it an abstract event. There may be some top level
 * event types which have no corresponding abstract event type.
 */
var _eventModes = ['', 'Direct', 'FirstHandler' ];
var _abstractHandlerBaseNames =
['onTouchStart', 'onClick', 'onDragDone', 'onQuantizeDrag', 'onMouseWheel',
  'onMouseScroll', 'onKeyUp', 'onKeyDown', 'onKeyPress', 'onFocus', 'onBlur',
  'onMouseIn', 'onMouseOut', 'onMouseDown', 'onMouseUp' ];

for (var ei = 0; ei < _eventModes.length; ei++) {
  for (var hi = 0; hi < _abstractHandlerBaseNames.length; hi++) {
    FaxEvent.abstractHandlerNames[
      _abstractHandlerBaseNames[hi] + _eventModes[ei]] = true;
  }
}



/**
 * The Fax system needs to listen to document scroll events to update the single
 * point of inventory on the document's currently scrolled to position. The idea
 * is that there's a single point where this is maintained and always kept up to
 * date. Anyone who wants to know that value should as the FEnv what the latest
 * value is. If everyone queried the document when they wanted to know the
 * value, they'd trigger reflows like mad. I don't think we needed to normalize
 * the target here. Check this on safari etc - we only care about one very
 * specific event on a very specific target - as long as it works for that case.
 */
FaxEvent.registerDocumentScrollListener = function() {
  var previousDocumentScroll = document.onscroll;
  document.onscroll = function(nativeEvent) {
    if(nativeEvent.target === document) {
      FEnv.currentScrollLeft =
        document.body.scrollLeft +
            document.documentElement.scrollLeft;
      FEnv.currentScrollTop =
        document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    if(previousDocumentScroll) {
      previousDocumentScroll(nativeEvent);
    }
  }
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
    if (targ.className && targ.className.search(/noSelect/) !== -1) {
      (nativeEvent || window.event).returnValue = false;
    }
    if (previousOnSelectStart) {
      previousOnSelectStart(nativeEvent || window.event);
    }
  }
}


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

FaxEvent.registerTopLevelListener = function(mountAt) {
  FaxEvent.registerDocumentScrollListener();
  FaxEvent.registerIeOnSelectStartListener();
  /**
   * #todoie: onmouseover/out do not work on the window element on IE*, will
   * likely need to capture using addEventListener/attachEvent.
   */
  FaxEvent.__trapBubbledEvent('topLevelMouseMove', 'onmousemove', mountAt || document);
  FaxEvent.__trapBubbledEvent('topLevelMouseIn', 'onmouseover', mountAt || document);
  FaxEvent.__trapBubbledEvent('topLevelMouseDown', 'onmousedown', mountAt || document);
  FaxEvent.__trapBubbledEvent('topLevelMouseUp', 'onmouseup', mountAt || document);
  FaxEvent.__trapBubbledEvent('topLevelMouseOut', 'onmouseout', mountAt || document);
  FaxEvent.__trapBubbledEvent('topLevelClick', 'onclick', mountAt || document);
  FaxEvent.__trapBubbledEvent('topLevelMouseWheel', 'onmousewheel', mountAt || document);

  /**
   * #todoie: Supposedly, keyup/press/down won't bubble to window on ie, but
   * will bubble to document. Maybe we should just trap there.
   * http://www.quirksmode.org/dom/events/keys.html.
   */
  FaxEvent.__trapBubbledEvent('topLevelKeyUp', 'onkeyup', mountAt || document);
  FaxEvent.__trapBubbledEvent('topLevelKeyPress', 'onkeypress', mountAt || document);
  FaxEvent.__trapBubbledEvent('topLevelKeyDown', 'onkeydown', mountAt || document);

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
  FaxEvent.__trapCapturedEvent('topLevelTouchStart', 'touchstart', mountAt || document);
  FaxEvent.__trapCapturedEvent('topLevelFocus', 'focus', mountAt || window);
  FaxEvent.__trapCapturedEvent('topLevelBlur', 'blur', mountAt || window);


  /** http://www.quirksmode.org/dom/events/tests/scroll.html (Firefox needs to
   * capture a diff mouse scroll); */
  FaxEvent.__trapCapturedEvent('topLevelMouseWheel', 'DOMMouseScroll', mountAt || document);
  FaxEvent.__trapCapturedEvent('topLevelMouseScroll', 'scroll', mountAt || document);
};


function _constructAbstractEventDirectlyFromTopLevel(topLevelEventType,
                                                     nativeEvent,
                                                     target) {
  var data;
  switch(topLevelEventType) {
    case 'topLevelMouseWheel':
      data = FaxEvent._normalizeAbstractMouseWheelEventData(nativeEvent, target);
      break;
    case 'topLevelMouseScroll':
      data = FaxEvent._normalizeAbstractScrollEventData(nativeEvent, target);
      break;
    case 'topLevelClick':
    case 'topLevelMouseDown':
    case 'topLevelMouseUp':
      data = FaxEvent._normalizeMouseData(nativeEvent, target);
      break;
    default:
      data = {};
  }

  return new AbstractEvent(
      FaxEvent.topLevelEventTypesDirectlyMappedToAbstractHandlerName[
        topLevelEventType],
      topLevelEventType,
      target,
      nativeEvent,
      data);
}


/**
 * We test for the most time sensitive events first to get them out of the way
 * (we don't need any additional slow down when dispatching scroll/mousemove
 * events.
 */
function _handleTopLevel(topLevelEventType, nativeEvent, targ) {
  var abstractEventHandlersById =
      FaxEvent.abstractEventHandlersById, nextId = targ.id;
  if (topLevelEventType === 'topLevelMouseMove') {
    FaxEvent._handleMouseMove(nativeEvent, targ);
    return;
  }
  if (topLevelEventType === 'topLevelMouseUp') {
    FaxEvent._handleMouseUp(nativeEvent, targ);
    return;
  }


  /**
  if(topLevelEventType === 'topLevelFaxSystemScroll') {

  }

  // Get first dom node with a registered id.
  while (targ.parentNode && targ.parentNode !== targ &&
      (nextId === null || nextId.length === 0)) {
    targ = targ.parentNode;
    nextId = targ.id;
  }

  if (topLevelEventType === 'topLevelMouseIn' ||
      topLevelEventType === 'topLevelMouseOut') {
    FaxEvent._handleMouseInOut(topLevelEventType, nativeEvent, targ);
    return;
  }

  /**
   * We don't currently have a good way to tell the event system to "stop
   * bubbling". In fact, that somewhat breaks encapsulation. Parents have the
   * option, instead, to declare that they are interested in events that have
   * not been bubbled up, or events that may/may not have been bubbled.
   * Currently, we'll have two modes, 'direct' and default (which encompasses
   * direct events and bubbled). Not yet implemented explicitly specifying that
   * events must be indirect.
   */
  var handledYet = false;
  if(nextId && nextId.length !== 0) {
    handledYet = FaxEvent.standardBubblingIteration(
        nextId,
        topLevelEventType,
        'Direct',
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
          'FirstHandler',
          nativeEvent,
          targ);
    }
    handledYet = FaxEvent.standardBubblingIteration(
      nextId,
      topLevelEventType,
      '', nativeEvent,
      targ) || handledYet;
    var lastIndexDot = nextId.lastIndexOf(".");
    // still works even if lastIndexDot is -1
    nextId = nextId.substr(0, lastIndexDot);
  }
}

module.exports = FaxEvent;


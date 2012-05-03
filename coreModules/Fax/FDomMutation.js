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
var FEvent = require('./FEvent');
var FDomUtils = require('./FDomUtils');
var keyOf = Fu.keyOf;

/* Useful resolved keys. */
var CLASS_SET_KEY = keyOf({classSet: null});
var STYLE_KEY = keyOf({style: null});
var POS_INFO_KEY = keyOf({posInfo: null});
var CONTENT_KEY = keyOf({content: null});
var DANGEROUSLY_SET_INNER_HTML_KEY = keyOf({dangerouslySetInnerHtml: null});
var INNER_HTML_KEY = keyOf({innerHtml: null});

/* FDomAttributes */
var _extractAndSealPosInfoImpl = FDomAttributes.extractAndSealPosInfo;
var controlUsingSetAttr = FDomAttributes.controlUsingSetAttr;
var controlSimply = FDomAttributes.controlSimply;
var controlDirectlyNonIdempotent = FDomAttributes.controlDirectlyNonIdempotent;


/* FDomUtils */
var singleDomNodeFromMarkup = FDomUtils.singleDomNodeFromMarkup;
var insertNodeAfterNode = FDomUtils.insertNodeAfterNode;
var serializeInlineStyle = FDomUtils.serializeInlineStyle;
var renderClassSet = FDomUtils.renderClassSet;
var appendMarkup = FDomUtils.appendMarkup;

/* FDomTraversal */
var FDomTraversal = require('./FDomTraversal');
var traverseChildStructures = FDomTraversal.traverseChildStructures;

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

    } else if(propKey === STYLE_KEY) { // See Comment 1
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


var computeNameIndices = function(arr) {
  var i, item, name, indices = {};
  var len = arr.length;
  for (i = 0; i < len; i++) {
    item = arr[i];
    name = item && item.name;
    indices[name] = i;
  }
  return indices;
};

/**
 * @reconcileDomChildren: Reconciles dom children with the provided
 * @childStructure - new child structure that should exist.
 * -(Comment 1) We memoize these child indices for use in the next reconciliation.
 *  nextChildIndices[t] = curChildIndices[t+1]
 */
var reconcileDomChildrenMultiPass = function(childStructures) {
  if (!childStructures && !this.logicalChildren) {
    return;
  }
  var currentChildren = (childStructures && !this.logicalChildren) ?
    this.logicalChildren = [] :
    this.logicalChildren;

  var cleanUp = {};
  function release () {
    FEvent.releaseMemoryReferences(cleanUp);
    cleanUp = {};
  }

  var nextChildren = [];
  var nextChildIndices = {};   // See (Comment 1)
  var curChildIndices = {};  
  var nextCount = 0;
  var onChildFound = function(nextChild, name) {
    nextChild.name = name;
    nextChildren.push(nextChild);
    nextChildIndices[name] = nextCount;
    nextCount++;
  };

  var onEmptyChildFound = function(name) {
    nextChildren.push(null);
    nextChildIndices[name] = nextCount;
    nextCount++;
  };

  traverseChildStructures(childStructures, onChildFound, onEmptyChildFound);

  /*
   * When rendering - we compute curChildIndices - but we could easily rip that
   * computation out of the render path and fall back on this.
   *
   * -(Comment 1) If we need to allocate new resources because the name was
   * previously used to represent a different type of component.
   */
  curChildIndices = this.curChildIndices || computeNameIndices(currentChildren);

  var rootDomNode = this.rootDomNode;
  var newChildren = [];
  var domCursor = null;
  var max = Math.max(currentChildren.length, nextChildren.length);
  for (var j=0; j < max; j++) {
    var cur = currentChildren[j];
    var next = nextChildren[j];
    if (next) {
      var nextName = next.name;
      var nextId = this._rootDomId + '.' + nextName;
      var nextUsedToBeAt = curChildIndices[nextName];
      var nextUsedToBe = currentChildren[nextUsedToBeAt];
      /* Condition for needing to allocate new resources. */
      if (!nextUsedToBe ||
          nextUsedToBe && nextUsedToBe.constructor !== next.constructor) {
        /* See (Comment 1) */
        if (nextUsedToBe && nextUsedToBe.constructor !== next.constructor) {
          cleanUp[nextId] = true;
          release();
        }
        /* Allocate resources and insert */
        newChildren[j] = next;
        domCursor = FDomUtils.insertNodeAfterNode(
          rootDomNode,
          FDomUtils.singleDomNodeFromMarkup(next.genMarkup(nextId)),
          domCursor
        );
      } else {
        nextUsedToBe.doControl(next.props);
        if (nextUsedToBeAt === j) {
          // The common case is fast thanks to nextUsedToBeAt !== j check!
          domCursor = domCursor ? domCursor.nextSibling :
                        rootDomNode.firstChild;
          newChildren[j] = nextUsedToBe;
        } else {
          // Could use document.getElementById or offset into children.
          newChildren[j] = nextUsedToBe;
          domCursor = insertNodeAfterNode(
            rootDomNode,
            rootDomNode.removeChild(
              nextUsedToBe.rootDomNode ||
                document.getElementById(nextUsedToBe._rootDomId)
            ),
            domCursor
          );
        }
      }
    }

    /*
     * So far, the algorithm has been passing through the next children array,
     * finding any old instance that match the name and reusing that instance to
     * preserve local state. If next was truthy, we found the correct instance
     * from the previous currentChildren to use. But now, we need to "look ahead"
     * to see if the current instance at location j *will* be claimed. If not,
     * no one else will clean up the resources so we have to do it. This doesn't
     * even have anything to do with nextChildren[j] except for the fact that it
     * happens to be at the same index - dealing with this now saves an extra
     * pass through the entire array sets.
     */
    var curIsNotInNextChildrenOrIsFalseyInNextChildren =
      cur &&
          (nextChildIndices[cur.name] === undefined ||
          !nextChildren[nextChildIndices[cur.name]]);
      
    if (curIsNotInNextChildrenOrIsFalseyInNextChildren) {
      /*
       * No need to call release() since it won't be replaced with a substituted
       * child of the same name. In every other case where we've called release()
       * - it was because we were going to replace the instance with a new
       * instance that had the same id (and we would have gotten callbacks fired
       * on the new instance - though they were intended for the old.
       */
      cleanUp[cur._rootDomId] = true;
      rootDomNode.removeChild(
        cur.rootDomNode || document.getElementById(cur._rootDomId)
      );
    }
  }
  release();
  this.logicalChildren = newChildren;
  this.curChildIndices = nextChildIndices;
};

exports.reconcileDomChildrenMultiPass = reconcileDomChildrenMultiPass;

/**
 * @insertNewInstance: Initializes (sets up handlers etc) and computes markup
 * for @newInstance. Inserts the new markup into the dom after @after.
 * Has side effects on @newInstance in that it initializes it and mounts it at
 * the @newInstanceId namespace.
 * @returns the new dom node that was inserted.
 */
var insertNewInstance = function(newInstance, newInstanceId, root, after) {
  return FDomUtils.insertNodeAfterNode(
    root,
    FDomUtils.singleDomNodeFromMarkup(newInstance.genMarkup(newInstanceId)),
    after
  );
};

/**
 * @moveExistingInstanceDom: For a given @instance, moves its dom resources
 * after @after. Does not have side effects on @instance, but has side effects
 * on the dom (of course).
 * @returns the dom node that was move.
 */
var moveExistingInstanceDom = function(instance, instanceId, root, after) {
  return insertNodeAfterNode(
    root,
    root.removeChild(
      instance.rootDomNode ||
      document.getElementById(instanceId)
    ),
    after
  );
};



/**
 * @reconcileDomChildren: Reconciles dom children with the provided
 * @childStructure - new child structure that should exist.
 * This implementation is biased - in that if elements change positions to
 *  somewhere ealier in the list, we will be able to perform the algorithm in
 *  a *very* online manner. We can account for every name that occurs to the
 *  left of the cursor. If we notice that the contents of the 
 * -(Comment 1) We memoize these child indices for use in the next
 * reconciliation. nextChildIndices[t] = curChildIndices[t+1]
 * -(Comment 2) When rendering - we compute childIndices - but we could easily
 *  rip that computation out of the render path and fall back on this.
 * -(Comment 3) If we need to allocate new resources because the name was
 *  previously used to represent a different type of component.
 *
 * Assumptions: At all times, for any i, we know the child at index i, and for
 * any child name we know the index that that named child resides at. We mantain
 * this information without ever making a second pass.
 *
 *
 *
 * +-----------------+        + domCursor (next insertion point)
 * |  eviction pool  |        |
 * |                 |        | 
 * +-----------------+        |     + cursor (logical)
 *                            |     |
 * The DOM:                   v     v
 * +--------------------------------|------------------------------------------+
 * | A    B    C    D    E    F     |    Z    Q
 * +--------------------------------|------------------------------------------+
 *                                  |
 * Logical Children:                |
 * +--------------------------------|------------------------------------------+
 * | A    B    C    D    E    F     |    Z    Q
 * +--------------------------------|------------------------------------------+
 *                                  |    ^
 * Next Children Stream:            |    |
 * +--------------------------------|----------------->
 * | A    B    C    D    E    F     |    Q    R    Z    ?    ?
 * +--------------------------------|----------------->
 * \                               /
 *  \  fully reconciled region    /
 *
 * All dom content and logical children to the left of the cursor is reconciled
 * with the next child stream. In order make that happen in a single pass, we
 * may have had to evict some children without placing them in their final
 * location. We don't know their final location (if they even have one) because
 * we can't look ahead into the stream. In the example above, we need to place Q
 * in the location where Z resides. Z will eventually live two indices
 * downstream but we have no way of knowing that. We must put Z into the
 * eviction pool. When we insert Q into Z's location, we know how to fetch the
 * existing Q in Logical Children because we maintain the map that gives the
 * index for any child name (we maintain it as we traverse - no second pass is
 * needed). So we fetch the existing Q, reuse that object and put it at Z's old
 * location. We place Z into the eviction pool. Part of maintaining the map that
 * tells us every name's index involves updating that map to indicate when the
 * current index of a name is in the eviction pool! When we get to Z (two places
 * downstream, we will try to find the current Z by looking up its location in
 * the index map - it will tell us it's in the eviction pool.) When we place
 * an element from the eviction pool back into the logical children list/dom,
 * we need to remove it from the eviction pool. When the stream has terminated,
 * anything left in the eviction pool remained unclaimed and we must free the
 * resources associated with it.
 *
 * (Note: not shown on the diagram - is the fact that dom content associated
 * with evicted children may still reside in between reconciled dom content.
 * But that's just for simplicity - you could imagine it not being there - it
 * doesn't effect the algorithm.)
 *
 * (Note: this implementation is bias in that certain directional shifts will
 * be more performant than the other direction. One directional shifts will
 * not require storing members in the eviction pool, while the other direction
 * will require that every element enter and leave the eviction pool once. We
 * could easily write a mirror of this algorithm that biases the other direction
 * and swap algorithms intelligently when we know the direction that elements
 * are moving.
 */
var reconcileDomChildren = function(childStructures) {
  if (!childStructures && !this.logicalChildren) {
    return;
  }

  var lastCursor = 0;
  var EVICTION_INDEX = -999;
  var rootDomNode =
      this.rootDomNode ||
      (this.rootDomNode = document.getElementById(this._rootDomId));
  var rootDomId = this._rootDomId;
  var domCursor = null;
  var evictionPool = {};
  
  var logicalChildren = (childStructures && !this.logicalChildren) ?
    this.logicalChildren = [] :
    this.logicalChildren;

  var cleanUp = {};
  function release () {
    FEvent.releaseMemoryReferences(cleanUp);
    cleanUp = {};
  }

  /* See (Commment 2) */
  var childIndices = this.childIndices || computeNameIndices(logicalChildren);

  /**
   * @evictAt: Evicts whatever currently resides at the cursor so that we can
   * reuse the position in logicalChildren. It's stored in the eviction pool so
   * that if something further in the nextChild stream needs to reuse it, it can
   * be retrieved.
   */
  var evictChildAt = function(i) {
    var toEvict = logicalChildren[i];
    if (!toEvict) {
      return;
    }
    var name = toEvict && toEvict.name;
    childIndices[name] = EVICTION_INDEX;
    evictionPool[name] = toEvict;
  };

  /**
   * @placeLogicalChildAt: Places a child at the cursor, and udpates all
   * mappings used to keep track of it. Including pointing childIndices away
   * from the EVICTION_INDEX.
   */
  var placeLogicalChildAt = function(child, i) {
    logicalChildren[i] = child;
    childIndices[child.name] = i;
    delete evictionPool[child.name];
  };

  /**
   * @onEmptyChildFound: Evict whatever might already reside there.
   */
  var onEmptyChildFound = function(name, cursor) {
    /*
     * Now remember, we're not evicting the empty child found, just the instance
     * tha happens to reside at this particular cursor location.
     */
    evictChildAt(cursor);
    logicalChildren[cursor] = null;
    childIndices[name] = cursor;
    lastCursor = cursor;
  };

  /**
   * @onChildFound: Invoked each time a child is discovered. @cursor provides
   * the index into the flattened child list.
   * Invariant: Any object in the eviction pool used to reside at an index less
   * than the cursor and therefore a number not equal to the cursor.
   */
  var onChildFound = function(next, nextName, cursor) {
    next.name = nextName;
    var nextId = rootDomId + '.' + nextName;
    var alreadyExistsAt =
      childIndices[nextName] === EVICTION_INDEX && evictionPool[nextName] ?
        EVICTION_INDEX :
      childIndices[nextName] !== undefined &&
      logicalChildren[childIndices[nextName]] ?
        childIndices[nextName] : false;
    var alreadyExistsElsewhere = alreadyExistsAt && alreadyExistsAt !== cursor;
    var alreadyExistingInstance =
        alreadyExistsAt === EVICTION_INDEX ? evictionPool[nextName] :
                         logicalChildren[alreadyExistsAt];
    var currentlyDifferentType =
        alreadyExistingInstance &&
        alreadyExistingInstance.constructor !== next.constructor;
    
    if (alreadyExistsElsewhere) {  // Something else must have already been here
      evictChildAt(cursor);
    }
    if (!alreadyExistingInstance) {
      placeLogicalChildAt(next, cursor);
      domCursor = insertNewInstance(next, nextId, rootDomNode, domCursor);
    } else if(currentlyDifferentType) {
      /* The only reference is either in the eviction pool or at some
       * future index that we will drop. */
      cleanUp[nextId] = true;    /* See (Comment 1) */
      release();
      rootDomNode.removeChild(
          alreadyExistingInstance.rootDomNode ||
          document.getElementById(alreadyExistingInstance._rootDomId));

      placeLogicalChildAt(next, cursor);
      domCursor = insertNewInstance(next, nextId, rootDomNode, domCursor);
    } else {
      placeLogicalChildAt(alreadyExistingInstance, cursor);
      alreadyExistingInstance.doControl(next.props);
      if (alreadyExistsElsewhere) {
        domCursor =
          moveExistingInstanceDom(
            alreadyExistingInstance, nextId, rootDomNode, domCursor);
      } else {
        /* Same type && index - we already controlled, so move the dom cursor */
        domCursor = domCursor ? domCursor.nextSibling : rootDomNode.firstChild;
      }
    }
    lastCursor = cursor;
  };
  
  traverseChildStructures(childStructures, onChildFound, onEmptyChildFound);
  /*
   * Pretends to feed nulls through the stream for every index not accounted for
   * by the stream. (In other words, the list of children shrunk since last time)
   */
  var curLength = logicalChildren.length;
  for (var k=lastCursor + 1; k < curLength; k++) {
    onEmptyChildFound(
      logicalChildren[k] ? logicalChildren[k].name :
      'ifItWasNullBeforeItDoesntMatterWhatItsNameWas',
      k
    );
  }
  logicalChildren.length = lastCursor + 1;

  /*
   * No need to delete from eviction pool - just let GC clean it.
   */
  var toEvict, evictionName;
  for (evictionName in evictionPool) {
    if (!evictionPool.hasOwnProperty(evictionName)) {
      continue;
    }
    toEvict = evictionPool[evictionName];
    cleanUp[toEvict._rootDomId] = true;   // See (Comment 1-1)
    delete childIndices[evictionName];
    rootDomNode.removeChild(
        toEvict.rootDomNode || document.getElementById(toEvict._rootDomId));
  }
  release();
};

exports.reconcileDomChildren = reconcileDomChildrenMultiPass;



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

var FaxUtils = require('./FaxUtils'),
    FaxDomAttributes = require('./FaxDomAttributes'),
    FaxBrowserUtils = require('./FaxBrowserUtils'),
    FaxDomUtils = require('./FaxDomUtils'),
    FaxEvent = require('./FaxEvent');

/** FaxUtils */
var keyOf = FaxUtils.keyOf,
    clone = FaxUtils.clone,
    merge = FaxUtils.merge,
    mergeStuff = FaxUtils.mergeStuff,
    mixin = FaxUtils.mixin,
    mixinExcluded = FaxUtils.mixinExcluded,
    mergeDeep = FaxUtils.mergeDeep,

    /* FaxEvent */
    registerHandlers = FaxEvent.registerHandlers,
    registerHandlerByName = FaxEvent.registerHandlerByName,
    abstractHandlerTypes = FaxEvent.abstractHandlerTypes,

    /** FaxBrowserUtils */
    escapeTextForBrowser = FaxBrowserUtils.escapeTextForBrowser,

    /** FaxDomAttributes */
    controlUsingSetAttr = FaxDomAttributes.controlUsingSetAttr,
    controlSimply = FaxDomAttributes.controlSimply,
    serializeInlineStyle = FaxDomAttributes.serializeInlineStyle,
    tagAttrMarkupFragment = FaxDomAttributes.tagAttrMarkupFragment,
    renderSimply = FaxDomAttributes.renderSimply,
    controlDirectlyNonIdempotent = FaxDomAttributes.controlDirectlyNonIdempotent,
    allTagAttrsAndHandlerNamesLookup = FaxDomAttributes.allTagAttrsAndHandlerNamesLookup,

    /** FaxDomUtils */
    singleDomNodeFromMarkup = FaxDomUtils.singleDomNodeFromMarkup,
    insertNodeAfterNode = FaxDomUtils.insertNodeAfterNode,
    appendMarkup = FaxDomUtils.appendMarkup;

/** By default - use standard absolute positioning. */
var _extractAndSealPosInfoImpl = FaxDomAttributes.extractAndSealPosInfo;
var idPrefixesAwaitingClearing = exports.idPrefixesAwaitingClearing = {};
var componentCurrentlyProjectingLock = null;

var ERROR_MESSAGES = {
  UPDATE_STATE_PRE_PROJECT: "Cannot update state before your done projecting!!",
  CANNOT_SET_INNERHTML: "YOU CANNOT EVER SET INNERHTML. You must use the name " +
                        "That evokes what is really going on. dangerouslySetInnerHtml",
  MUST_SPECIFY_TOP_COMP: "You must specify a top level constructor - or component " +
                         "declarative creation specification - i.e. {something:x}.Div(). " +
                         "What you specified appears to be null or not specified. If " +
                         "specifying a declarative block - make sure you execute " +
                         "Fax.using(moduleContainingTopmostComponent) in the file where " +
                         "you render the top level component.",
  CLASS_NOT_COMPLETE: "Class does not implement required functions!",
  NO_DOM_TO_HIDE: "No DOM node to hide!",
  CONTROL_WITHOUT_BACKING_DOM: "Trying to control a native dom element " +
                               "without a backing id"
};


/**
 * Resolved key names simply for minification purposes. (See keyOf).
 */
var CLASS_SET_KEY = keyOf({ classSet: null }),
    CLASSNAME_KEY = keyOf({ className: null }),
    STYLE_KEY = keyOf({ style: null }),
    POS_INFO_KEY = keyOf({ posInfo: null }),
    CONTENT_KEY = keyOf({ content: null }),
    DANGEROUSLY_SET_INNER_HTML_KEY = keyOf({ dangerouslySetInnerHtml: null }),
    INNER_HTML_KEY = keyOf({ innerHtml: null }),
    DYNAMIC_HANDLERS_KEY = keyOf({ dynamicHandlers: true }),
    VALUE_KEY = keyOf({ value: true });

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
var renderClassSet = function(namedSet) {
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
        accum += renderClassSet(val);
      }
    }
  }
  return accum;
};



/**
 * controlPhysicalDomByNodeOrId: Useful when you have a dom node or at least an
 * id of an element, properties, and want to control the entire node based on
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
var controlPhysicalDomByNodeOrId = function (elem,
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
      if(propKey === CLASS_SET_KEY) {
        elem.className = escapeTextForBrowser(renderClassSet(prop));
      } else if (controlUsingSetAttr[propKey]) {
        elem.setAttribute(controlUsingSetAttr[propKey], prop);
      } else if (propKey === VALUE_KEY) {
        if (elem.value !== nextProps.value) {
          elem.value = nextProps.value;
        }
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
      } else if (controlSimply[propKey]) {
        elem[controlSimply[propKey]] = escapeTextForBrowser(prop);
      } else if(propKey === STYLE_KEY) {
        cssText += serializeInlineStyle(prop);
      } else if(propKey === POS_INFO_KEY) {
        cssText += _extractAndSealPosInfoImpl(prop);
      } else if (controlDirectlyNonIdempotent[propKey]) {
        currentValue = elem[controlDirectlyNonIdempotent[propKey]];
        if (currentValue !== prop) {
          elem[controlDirectlyNonIdempotent[propKey]] = prop;
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
      idPrefixesAwaitingClearing[deallocId] = true;
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
    delete idPrefixesAwaitingClearing[newChildId];
    if (myChildren[propKey]) {
      lastIteratedDomNodeId = newChildId;
    } else {
      if ((!ignoreProps || !ignoreProps[propKey]) && prop && prop.maker) {
        // If there's not yet a child and we want to allocate a component
        newChild = new (prop.maker)( prop.props, prop.instantiator);
        newMarkup = newChild.genMarkup(newChildId, true, true);
        myChildren[propKey] = newChild;
        var newDomNode = singleDomNodeFromMarkup(newMarkup);
        insertNodeAfterNode(
          this.rootDomNode || (this.rootDomNode = document.getElementById(rootDomId)),
          newDomNode,
          document.getElementById(lastIteratedDomNodeId));
        lastIteratedDomNodeId = newChildId;
      }
    }
  }
}

var UniversalPublicMixin = {
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

var UniversalPrivateMixin = {
  /**
   * Just updates the state without automatically reprojecting.
   */
  justUpdateState: function(nextStateFragment) {
    mergeStuff(this.state, nextStateFragment);
  },
  justUpdateStateDeep: function(nextStateFragment) {
    this.state = mergeDeep(this.state, nextStateFragment);
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
    if (componentCurrentlyProjectingLock) {
      throw ERROR_MESSAGES.UPDATE_STATE_PRE_PROJECT;
    }
    this.justUpdateState(nextStateFragment);
    this._doControlImpl();
    return true;
  },

  updateStateDeep: function(nextStateFragment) {
    if (componentCurrentlyProjectingLock) {
      throw ERROR_MESSAGES.UPDATE_STATE_PRE_PROJECT;
    }
    this.justUpdateStateDeep(nextStateFragment);
    this._doControlImpl();
    return true;
  },

  _restucture: function() {
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

  oneValueStateUpdater: function (singleKeyDescriptionObj) {
    var ths = this;
    return function(singleVal) {
      var keyToUpdate = keyOf(singleKeyDescriptionObj);
      var updateBlock = {};
      if (keyToUpdate) {
        updateBlock[keyToUpdate] = singleVal;
        ths.updateState(updateBlock);
      }
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


var MakeComponentClass = exports.MakeComponentClass = function(spec, addtlMixins) {
  var j, specKey = null, mixinKey = null;
  var prototypeBlackList = { initState: true };
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
        this.state = clone(spec.initState);
      }
    }
  };
  mixinExcluded(ComponentClass, spec, prototypeBlackList);
  mixin(ComponentClass, UniversalPublicMixin);
  mixin(ComponentClass, UniversalPrivateMixin);
  for (j=0; j < addtlMixins.length; j++) {
    mixin(ComponentClass, addtlMixins[j]);
  }
  if (!ComponentClass.prototype._genMarkupImpl ||
      !ComponentClass.prototype.structure) {
    throw ERROR_MESSAGES.CLASS_NOT_COMPLETE;
  }
  return ComponentClass;
};


/**
 * StandardComponentMixin. Most components you define will be a 'standard'
 * component. Meaning it only really has a single child. Even if that single
 * child is a 'MultiDynamic' child with several children - your component only
 * has a single child.
 */
var StandardComponentMixin = exports.StandardComponentMixin = {
  _doControlImpl: function() {
    this.child.doControl(this._getProjection().props);
  },
  _genMarkupImpl: function(idSpaceSoFar, gen, events) {
    var proj = this._getProjection();
    this.child = new proj.maker(proj.props, proj.instantiator);
    return this.child.genMarkup(idSpaceSoFar, gen, events);
  },

  _getProjection: function() {
    componentCurrentlyProjectingLock = this;
    var proj = this.structure();
    componentCurrentlyProjectingLock = null;
    return proj;
  },

  _controlDomNode: function (path, domAttrs) {
    var normalized = path.replace('projection', '');
    controlPhysicalDomByNodeOrId(
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
 * OrderedComponentMixin: A component that houses an array of components, each
 * having the same 'type'.  Manages construction/destruction of DOM elements in
 * an inefficient manner.  This should only be used with an array projection of
 * components for which each element is the exact same type (accepts the same
 * props) and where each element is indistinguishable from the others (each
 * holds no state.) Todo: Have this clean up memory in the same way that the
 * multi dynamic does.
 */
var OrderedComponentMixin = exports.OrderedComponentMixin = {

  /**
   * At this point, this.children is as before appending or deleting any
   * children, but props is the new properties.  TODO: get this to work with
   * i.e. table elements
   */
  _doControlImpl: function() {
    var child, childToReconcile, newChild, projection, newMarkup,
        jj, ii, kk, domNodeToRemove, projectionToReconcile = this.props,
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
        throw(ERROR_MESSAGES.NO_DOM_TO_HIDE);
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
      appendMarkup(document.getElementById(this._rootDomId), newMarkup);
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
  structure: function() {
    return this.props;
  }
};



/**
 * MultiDynamic Component Mixins: currently the only client of the
 * multiChildMixins, but that could change soon.
 */
var MultiDynamicComponentMixin = exports.MultiDynamicComponentMixin = {
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

  structure: function() {
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
 * @param component spec - an obj of type {structure: Props->Projection<Child>}
 * @return projection constructor of type {props: Props, maker: unit->Child}
 */
var Componentize = exports.Componentize = function(spec) {
  var Constructor =
      MakeComponentClass(spec, [StandardComponentMixin]);
  var ProjectingConstructor = function(propsArgs) {
    var props = propsArgs || this;
    return {
      instantiator: componentCurrentlyProjectingLock,
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
var ComponentizeAll = exports.ComponentizeAll = function(obj) {
  var ret = {}, memberName;
  for (memberName in obj) {
    if (!obj.hasOwnProperty(memberName)) {
      continue;
    }
    var potentialComponent = obj[memberName];
    if (potentialComponent && typeof potentialComponent !== 'function' &&
        potentialComponent.structure) {
      ret[memberName] = Componentize(potentialComponent);
    } else {
      // otherwise assume already componentized.
      ret[memberName] = potentialComponent;
    }
  }
  return ret;
};

/**
 * Before the initial render, call this function to ensure that we compute
 * position information in a way that performs best.
 */
var setBrowserOptimalPositionComputation =
exports.setBrowserOptimalPositionComputation = function(useTransforms) {
  _extractAndSealPosInfoImpl = FaxDomAttributes.getBrowserPositionComputation(useTransforms);
};

/**
 * makeDomContainerComponent: Creates a controllable native tag component
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
 *   (many more):   see controlUsingSetAttr/renderSimply
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
var makeDomContainerComponent =
exports.makeDomContainerComponent =
function(tag, optionalTagTextPar, pre, post, headText, footText) {
  var optionalTagText =  optionalTagTextPar || '',
      tagOpen = (pre || '') + "<" + tag + optionalTagText + " id='",
      tagClose = (footText || '') + "</" + tag + ">" + (post || ''),
      headTextTagClose = ">" + (headText || '');

  var NativeComponentConstructor = function(initProps) {
    this._rootDomId = null;
    this.props = initProps;
    this.children = {};
  };

  var ProjectingConstructor = function(propsParam) {
    return {
      props: propsParam || this,
      maker: NativeComponentConstructor
    };
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
   *   structure: function() {
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
      this.rootDomNode = controlPhysicalDomByNodeOrId(
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
    this._childReconciler( nextProps,
        allTagAttrsAndHandlerNamesLookup,
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
      registerHandlers(idRoot, handlerPack);
    }

    for (propKey in currentDomProps) {
      if (!currentDomProps.hasOwnProperty(propKey)) { continue; }
      prop = currentDomProps[propKey];
      if (prop === null || typeof prop === 'undefined') { continue; }

      if (doHandlers && abstractHandlerTypes[propKey]) {
        registerHandlerByName(idRoot, propKey, prop);
      }

      /* Accumulate these, so that we can make a single call to childGenerator. */
      if (prop.maker) {
        sawChildren = true;
        childProjections[propKey] = prop;
      } else if (doMarkup) {
        if (propKey === CLASS_SET_KEY) {
          tagAttrAccum += "class='";
          tagAttrAccum += renderClassSet(prop);
          tagAttrAccum += "'";
        } else if (renderSimply[propKey]) {
          tagAttrAccum += tagAttrMarkupFragment(propKey, prop);
        } else if (propKey === STYLE_KEY) {
          cssText += serializeInlineStyle(prop);
        } else if (propKey === POS_INFO_KEY) {
          cssText += _extractAndSealPosInfoImpl(prop);
        } else if (propKey === CONTENT_KEY) {
          innerMarkup = escapeTextForBrowser(prop);
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
};

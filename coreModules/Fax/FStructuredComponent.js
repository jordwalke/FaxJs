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

var FUtils = require('./FUtils');
var FDomMutation = require('./FDomMutation');
var FErrors = require('./FErrors');

/* FUtils */
var keyOf = FUtils.keyOf;
var clone = FUtils.clone;
var mergeStuff = FUtils.mergeStuff;
var mixin = FUtils.mixin;
var mergeDeep = FUtils.mergeDeep;

/* FDomMutation */
var controlSingleDomNode = FDomMutation.controlSingleDomNode;

var structuringInstanceLock = null;

/**
 * @AllStructuredComponentsHave: A "structured component" is a composite
 * component, whos composition is determined by the function "structure".  The
 * lowest level building blocks (in FDom) are reactive, and when you build a
 * structured component, you can build components that are higher level,
 * composite components, while still being reactive.  This is the type of
 * component that you'll likely be making - all *you* have to do is implement a
 * function called "structure".  Then call "Componentize" to turn your function
 * into a fully reactive component.
 *
 * var MyComponent = F.Componentize({
 *   structure: function() {
 *     return Div({content: 'hello'});
 *   }
 * });
 *
 * Everything from AllStructuredComponentsHave will be mixed into the
 * specification you provide (alongside "structure"). There's a couple of
 * additional special functions that Componentize will accept:
 *
 * initState: A object literal (or function that returns an object literal) that
 * will be set to "this.state" when your object is instantiated.
 *
 * propTrigger: A function used to detect transitions in props on your component
 * instance. In very rare cases, it may be necessary - but hardly ever.
 *
 * The core reactive api (doControl/genMarkup) is taken care of for you. If you
 * were building a lower level component (for perf optimizations etc) you'd want
 * to implement doControl/genMarkup carefully yourself - but usually you'll just
 * do as the above example.
 */
var AllStructuredComponentsHave = {
  /**
   * @doControl: Reacts to changes streamed from outside of the component.
   */
  doControl: function(props) {
    if (this.propTrigger) {
      var nextStateFragment = this.propTrigger(props);
      if (nextStateFragment) {
        this.justUpdateState(nextStateFragment);
      }
    }
    this.props = props;
    this._reconcileStructure();
  },

  /**
   * @genMarkup: Materializes the component into something that can be injected
   * into the dom - also allocates child component instances, and ensures all
   * events will be attached.  We look for a member called initState, which is
   * either a function that returns the initial state object, or a literal data
   * blob, that we clone because we mutate the state, and the initState object
   * is shared amongst all instances (mixed into the prototype). This cloning is
   * a bottle neck for rendering!  So make sure you don't have very large
   * objects for components that are instantiated thousands of times.
   */
  genMarkup: function(idRoot, gen, events) {
    var ret, initState;
    if(!events && this._optimizedRender) {
      return this._optimizedRender(idRoot);
    } else {
      initState = this.initState;
      if (initState) {  /* Likely from prototype */
        if (typeof initState === 'function') {
          this.state = initState.call(this, this.props);
        } else {
          this.state = clone(initState);
        }
      }
      this._rootDomId = idRoot;
      return this._genMarkup(idRoot, gen, events);
    }
  },

  /**
   * @justUpdateStateDeep: Just updates the state without automatically
   * propagating changes.
   */
  justUpdateState: function(nextStateFragment) {
    mergeStuff(this.state, nextStateFragment);
  },

  /**
   * @justUpdateStateDeep: Just updates the state without automatically
   * propagating changes. Does so deeply.
   */
  justUpdateStateDeep: function(nextStateFragment) {
    this.state = mergeDeep(this.state, nextStateFragment);
  },


  /**
   * @updateState: Convenience method around updating the state, and triggering
   * a refresh of all components lower than it in the component tree.  In some
   * cases, trying to determine what has changed in order to stop propagation
   * of changes isn't worth it. It's faster to just propagate the changes. As
   * soon as we start seeing really slow behavior without easy workarounds, we
   * will start to infer a data potential-dependency and use that information
   * to make updates faster. It's not as bad as you would think it would be.
   * todo: queueing of pushings, deterministic ordering, need to think about
   * that.
   */
  updateState: function(nextStateFragment) {
    FErrors.throwIf(structuringInstanceLock, FErrors.UPDATE_STATE_PRE_PROJECT);
    this.justUpdateState(nextStateFragment);
    this._reconcileStructure();
    return true;
  },

  /**
   * @updateStateDeep: The same as updateState, but merges in data in a deep
   * manner.
   */
  updateStateDeep: function(nextStateFragment) {
    FErrors.throwIf(structuringInstanceLock, FErrors.UPDATE_STATE_PRE_PROJECT);
    this.justUpdateStateDeep(nextStateFragment);
    this._reconcileStructure();
    return true;
  },

  /**
   * @_childAt: To be implemented: Should accept some series of object keys to
   * point to the path of a child. This is a can of worms, and encourages a
   * paradigm that I'm choosing not to focus on for the time being. However, it
   * would be great if someone implemented something like this for the rare
   * cases where declarative programming isn't as easy or concise.
   */
  _childAt: function(s) {
  },

  /**
   * @stateUpdaterConstant: Takes a literal block and returns a function that
   * when invoked uses that block to update the state.
   */
  stateUpdaterConstant: function(frag) {
    var ths = this;
    if (!frag) {
      return frag;
    }
    return function() {
      ths.updateState(frag);
    };
  },

  /**
   * @stateUpdater: Takes a function (will deprecate the fragment since we now
   * have stateUpdaterConstant), and returns a function that calls *your*
   * function, and uses the result of that to update the state.
   */
  stateUpdater: function(funcOrFragment) {
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

  /**
   * @oneValueStateUpdater: Accepts a key, and returns a function that accepts
   * a single value v. It then updates your state at the key you specified.
   * This is really convenient for onChange type of handlers.
   */
  oneValueStateUpdater: function(singleKeyDescriptionObj) {
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

  /**
   * @stateUpdaterCurry: accepts a function, and arguments, binding the
   * arguments to the function passed in. Returns a function that calls the
   * bound version (with any additional arguments known only at callback time,
   * and passes the result to this.updateState).
   */
  stateUpdaterCurry: function(func /*, other arguments*/) {
    var curriedArgs = Array.prototype.slice.call(arguments, 1);
    var ths = this;
    return function() {
      ths.updateState(func.apply(ths,
          curriedArgs.concat(Array.prototype.slice.call(arguments))));
    };
  },

  /*
   * Computes the next structure and reconciles it with what's currently
   * present.
   */
  _reconcileStructure: function() {
    structuringInstanceLock = this;
    var structure = this.structure();
    structuringInstanceLock = null;
    this.child.doControl(structure.props);
  },

  _genMarkup: function(idSpaceSoFar, gen, events) {
    structuringInstanceLock = this;
    var structure = this.structure();
    structuringInstanceLock = null;
    this.child = structure;
    return this.child.genMarkup(idSpaceSoFar, gen, events);
  },

  _controlDomNode: function(path, domAttrs) {
    var normalized = path.replace('structure', '');
    var complete = this._rootDomId + normalized;
    controlSingleDomNode(
        document.getElementById(complete),
        complete,
        domAttrs,
        null);
  },
  _childDom: function(path) {
    var normalized = path.replace('structure', '');
    return document.getElementById(this._rootDomId + normalized);
  }

};

/**
 * MakeNewStructuredComponentClass: Makes the actual prototypical class that the
 * convenience constructor uses.
 */
var MakeNewStructuredComponentClass =
exports.MakeNewStructuredComponentClass = function(spec) {
  var j, specKey = null;
  var Constructor = function(initProps) {
    this.props = initProps || {};
  };
  mixin(Constructor, spec);
  mixin(Constructor, AllStructuredComponentsHave);
  FErrors.throwIf(!Constructor.prototype.structure, FErrors.CLASS_NOT_COMPLETE);
  return Constructor;
};

/**
 * @Componentize: Makes a structured component given a specification. A
 * 'structured' component is one that implements a "structure" method that
 * returns a single child. That single child could have several children, or be
 * arbitrarily deep - but structure() still returns a single child.
 *
 * One thing that makes a "component" different than a standard prototypical
 * class, is you don't need to call new on it. A backing instance is created
 * with new for you, but components are convenience constructors around that
 * process so you can execute statements such as Div({}) without calling 'new'.
 *
 * @spec - an obj of type {structure: props->convenienceConstruction}
 * @return convenience constructor
 */
var Componentize = exports.Componentize = function(specWithStructure) {
  var Constructor = MakeNewStructuredComponentClass(specWithStructure);
  var ConvenienceConstructor = function(propsArgs) {
    var props = propsArgs || this;
    return new Constructor(props);
  };
  ConvenienceConstructor.originalSpec = specWithStructure;
  return ConvenienceConstructor;
};

/**
 * @ComponentizeAll: Componentizes all members in an object, actually replaces
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


var FaxUtils = require('./FaxUtils'),
    FaxEvent = require('./FaxEvent');


/**
 * We need to flatten all of these package records. Either as an uglify
 * processor stage, or in the code itself. Accessing data through objects is 20%
 * slower in Safari, and 12% slower in IE8.
 * http://jsperf.com/accessing-object-method/2/edits
 */
var _Fax = {
  beforeRendering: []
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


function _clone(o) {
 return JSON.parse(JSON.stringify(o));
}
function _ser(o) {
 return JSON.stringify(o);
}

if (typeof Fax === 'object') {
  if (Fax.keys(Fax._eventsById).length) {
    _Fax.Error("Unexpected pre-initialization");
  }
}

_Fax.TextNode = function(str) {
  return {
    __textNode: true,
    text: str
  };
};


/**
 * Must be set directly, not with a 'setAttribute' call. There are performance
 * gains to be had by setting all of the properties to be equal to the native
 * ones (no lookup needed), but who could stand to not use proper camel casing?
 */
_Fax.controlDirectlyDomAttrsMap = {
  innerHtml: 'innerHTML', value: 'value',
  scrollTop: 'scrollTop', scrollLeft: 'scrollLeft'
};

var logicalStyleAttrNamesMap = {
  boxSizing: 'box-sizing', boxShadow: 'box-shadow',
  paddingRight: 'padding-right', paddingLeft: 'padding-left',
  paddingTop: 'padding-top', paddingBottom: 'padding-bottom',
  marginRight: 'margin-right', marginLeft: 'margin-left',
  marginTop: 'margin-top', marginBottom: 'margin-bottom',
  zIndex: 'z-index', backgroundImage: 'background-image',
  border: 'border', borderTop: 'border-top',
  fontSize: 'font-size', fontWeight: 'font-weight',
  fontColor: 'font-color', textTransform: 'text-transform',
  textDecoration: 'text-decoration', textAlign: 'text-align',
  borderLeft: 'border-left', borderRight: 'border-right',
  borderBottom: 'border-bottom', borderColor: 'border-color',
  position: 'position', backgroundColor: 'background-color'
};

/**
 * _controlUsingSetAttrDomAttrsMap: Attributes of a dom node that show up in the
 * tag header and may be controlled after they are rendered. This not only can
 * be usd to check if an attribute is controllable but also determine the
 * appropriate name that we control the attribute with (sometimes they are
 * different (clss->class))
 */
var _controlUsingSetAttrDomAttrsMap = {
  margin: 'margin', marginRight: 'margin-right', marginLeft: 'margin-left',
  marginTop: 'margin-top', marginBottom: 'margin-bottom', padding: 'padding',
  paddingRight: 'padding-right', paddingLeft: 'padding-left',
  paddingTop: 'padding-top', paddingBottom: 'padding-bottom', width: 'width',
  height: 'height', clss: 'class', href: 'href', src: 'src'
};

/**
 * The one attribute I've found that can't be changed after rendering. The
 * problem is that the dom itself is not idempotent (at least ie8).
 */
_Fax.cannotEverControl = {
  type: 'type'
};

/**
 * Fax.markupDomTagAttrsMap: properties of the dom node that we can render in
 * the string markup. Usually, these can be controlled by executing
 * elem.setAttribute(fieldName, x), with a couple exceptions (type which can
 * never be controlled and value which must be set as a property). innerHTML is
 * an exception to all rules, so we don't talk much about it here - it's special
 * cased in the rendering code.
 */
_Fax.markupDomTagAttrsMap = {
  margin: 'margin', marginRight: 'margin-right', marginLeft: 'margin-left',
  marginTop: 'margin-top', marginBottom: 'margin-bottom', padding: 'padding',
  paddingRight: 'padding-right', paddingLeft: 'padding-left',
  paddingTop: 'padding-top', paddingBottom: 'padding-bottom',
  value: 'value', width: 'width', height: 'height',
  clss: 'class', type: 'type', href: 'href', src: 'src'
};

/**
 * Converts between convenient form of style attribute names and turns them into
 * the hyphenated (harder to type in declarative objects) versions.  We'll let
 * you pass any style attribute you want, but if you happen to hit one of these
 * supported ones, we'll translate into the harder to type hyphenated version.
 */
var _styleAttrNameForLogicalName = function(attr) {
  return logicalStyleAttrNamesMap[attr] || attr;
};

/** Set of attribute names for which we do not append 'px'. */
var _cssNumber = {
  textDecoration: true, zoom: true, fillOpacity: true, fontWeight: true,
  lineHeight: true, opacity: true, orphans: true, widows: true,
  zIndex: true, outline: true
};

/**
 * Convert a value into the proper css writable value. We shouldn't need to
 * convert NaN/null because we shouldn't have even gotten this far. The
 * attribute name should be logical (no hyphens).
 */
var _styleValue = function (logicalStyleAttrName, attrVal) {
  if(attrVal === NaN) {
    debugger;
  }
  if(attrVal !== 0 && !attrVal) {
    return '';
  }
  if(!isNaN(attrVal)) {
    return _cssNumber[logicalStyleAttrName] ? attrVal : (attrVal + 'px');
  }
  return attrVal;
};


/**
 * tagDomAttrsFragment: For attributes that should be rendered in the opening
 * tag of a dom node, this will return that little fragment that should be
 * placed in the opening tag - for this single attribute.
 */
function _tagDomAttrMarkupFragment(tagAttrName, tagAttrVal) {
  return _Fax.markupDomTagAttrsMap[tagAttrName] +
      "='" + FaxUtils.escapeTextNodeForBrowser(tagAttrVal) + "'";
}

function _innerHtmlMarkupFragment(innerHtmlAttrVal) {
  return FaxUtils.escapeTextNodeForBrowser(innerHtmlAttrVal);
}

/**
 * _tagStyleAttrsFragment:
 * {width: '200px', height:0} => " style='width:200px;height:0'". Undefined
 * values in the style object are completely ignored. That makes declarative
 * programming easier.
 */
function _tagStyleAttrFragment(styleObj) {
  var styleAccum = ' style="', logStyleAttrName, styleAttrVal;

  for (logStyleAttrName in styleObj) {
    if (!styleObj.hasOwnProperty(logStyleAttrName)) {
      continue;
    }
    styleAttrVal = styleObj[logStyleAttrName];
    if (styleAttrVal !== undefined) {
      styleAccum += _styleAttrNameForLogicalName(logStyleAttrName) + ":" +
          _styleValue(logStyleAttrName, styleObj[logStyleAttrName]) + ";";
    }
  }
  return styleAccum + '"';
}

var _serializeInlineStyle = function (styleObj) {
  var accum = '', logStyleAttrName;
  for (var logStyleAttrName in styleObj) {
    if (!styleObj.hasOwnProperty(logStyleAttrName)) {
      continue;
    }
    styleAttrVal = styleObj[logStyleAttrName];
    if (styleAttrVal !== undefined) {
      accum += _styleAttrNameForLogicalName(logStyleAttrName) +
        ":" + _styleValue(logStyleAttrName, styleAttrVal) + ";";
    }
  }
  return accum;
};


/**
 * Renders a projection at a particular dom node, and returns the component
 * instance that was derived from the projection. In summary here's the flow of
 * data:
 * (ProjectingConstructor(Props))=>Projection
 * Render(Projection)=>ComponentInstance mounted on the dom somewhere.
 * Changes to the component instance will be reflected on the DOM automatically.
 */
_Fax.renderAt = function(projection, id) {
  var mountAt = document.getElementById(id);
  if(!mountAt.parentNode || mountAt === document.body) {
    throw "You need to mount your application at least one node deeper " +
          "than the document body itself. I know, it's stupid but that's " +
          "what some browsers require for the way we handle events.";
  }
  if (_Fax.beforeRendering.length) {
    for (var i = _Fax.beforeRendering.length - 1; i >= 0; i--) {
      _Fax.beforeRendering[i]();
    }
  }

  var componentInstance = (new (projection.maker)(projection.props));
  var markup = componentInstance.genMarkup('.top', true, true);
  var nextSibling = mountAt.nextSibling;
  var parent = mountAt.parentNode;
  /** In some browsers, you'd be better off *not* removing the element before
   * setting the innerHTML - surprising. */
  parent.removeChild(mountAt);
  mountAt.innerHTML = markup;
  if(nextSibling) {
    parent.insertBefore(mountAt,nextSibling);
  } else {
    parent.appendChild(mountAt);
  }
  FaxEvent.ensureListening(mountAt);
  _executeDomReadyQueue();
  var renderedComponentInstance = componentInstance;
  return renderedComponentInstance;
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
_Fax.renderTopLevelComponentAt = function(TopLevelProjectingConstructor, id, options) {
  var dims = FaxUtils.getViewportDims();
  var cookies = FaxUtils.readCookie() || {};

  var topLevelCreateData = {
    chromeWidth: dims.chromeWidth, chromeHeight: dims.chromeHeight,
    cookies: cookies
  };
  var topLevelProjection = TopLevelProjectingConstructor(topLevelCreateData);
  if (options && options.appStyle) {
    document.body.className += ' nover';
  }
  var renderedComponentInstance = _Fax.renderAt(topLevelProjection, id);

  /**
   * Refresher function that does a control on the rendered dom node whenever
   * something in the top level data pipeline changes. This wipes out any
   * existing handler. Todo: put this in FaxEvent such that it populates FEnv
   * with reflow triggering data - so coders don't have to query the window for
   * these attributes.
   */
  window.onresize = function() {
    dims = FaxUtils.getViewportDims();
    var updateProps = {
      chromeHeight : dims.height,
      chromeWidth : dims.width,
      cookies: cookies
    };

  };
  FaxUtils._onCookieChange = function () {
    cookies = FaxUtils.readCookie() || {};
    var updateProps = {
      chromeHeight : dims.height,
      chromeWidth : dims.width,
      cookies: cookies
    };
    renderedComponentInstance.doControl(updateProps);
  };

  return renderedComponentInstance;
};


/**
 * Merges into an existing object - as in "merges" then "stuffs" into ths.
 */
_Fax.mergeStuff = function(ths, merge) {
  for (var aKey in merge) {
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
  var ret = {}, aKey, one = one || {}, two = two || {};
  for (aKey in one) {
    if (one.hasOwnProperty(aKey)) {
      ret[aKey] = one[aKey];
    }
  }
  for (aKey in two) {
    if (two.hasOwnProperty(aKey)) {
      ret[aKey] = two[aKey];
    }
  }
  return ret;
};

_Fax.mergeThree = function(one, two, three) {
  var ret = {}, aKey, one = one || {}, two = two || {}, three = three || {};

  for (aKey in one) {
    if (one.hasOwnProperty(aKey)) {
      ret[aKey] = one[aKey];
    }
  }
  for (aKey in two) {
    if (two.hasOwnProperty(aKey)) {
      ret[aKey] = two[aKey];
    }
  }
  for (aKey in three) {
    if (three.hasOwnProperty(aKey)) {
      ret[aKey] = three[aKey];
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
  if(obj1 instanceof Array || obj2 instanceof Array) {
    throw "mergeDeep not intended for merging arrays";
  }
  var obj2Terminal =
      obj2 === undefined || obj2 === null || typeof obj2 === 'string'
      || typeof obj2 === 'number' || typeof obj2 === 'function';

  if(obj2Terminal) {
    return obj2;
  }
  var obj1Terminal =
      obj1 === undefined || obj1 === null || typeof obj1 === 'string'
      || typeof obj1 === 'number' || typeof obj1 === 'function';

  // Wipe out
  if(obj1Terminal) {
    obj1 = obj1 || {};
  }

  for (var obj2Key in obj2) {
    if (!obj2.hasOwnProperty(obj2Key)) {
      continue;
    }
    obj1[obj2Key] = _Fax.mergeDeep(obj1[obj2Key], obj2[obj2Key]);
  }

  return obj1;

};

var Mixin = function(constructor, methodBag) {
  MixinExcluded(constructor, methodBag, {});
};
var MixinExcluded = function(constructor, methodBag, blackList) {
  for (var methodName in methodBag) {
    if (!methodBag.hasOwnProperty(methodName)) {continue;}
    if (blackList[methodName]) {continue;}
     constructor.prototype[methodName] = methodBag[methodName];
  }
};
_Fax.MakeComponentClass = function(spec, addtlMixins) {
  var specKey = null, mixinKey = null;
  var prototypeBlackList = {initModel: true};
  var ComponentClass = function(initProps) {
    this.props = initProps || {};

    this._strigifiedProps = null;
    this.model = {};
    this.lock = false; // Lock on updating model
    if (spec.initModel) {
      if (typeof spec.initModel === 'function') {
        this.model = spec.initModel.call(this, initProps);
      } else {
        /* A literal data blob, which we clone because we mutate the model, and
         * the initModel object is shared amongst all instances. */
        this.model = _clone(spec.initModel);
      }
    }
  };
  MixinExcluded(ComponentClass, spec, prototypeBlackList);
  Mixin(ComponentClass, _Fax.universalPublicMixins);
  Mixin(ComponentClass, _Fax.universalPrivateMixins);
  for (var j=0; j < addtlMixins.length; j++) {
    Mixin(ComponentClass, addtlMixins[j]);
  }
  if (!ComponentClass.prototype._allocateChildrenGenMarkup ||
   !ComponentClass.prototype.project) {
    _Fax.Error("Class does not implement required functions!");
  }

  return ComponentClass;
};

_Fax.universalPublicMixins = {
  doControl: function(props) {
    if (this._propertyTrigger) {
      var nextModelFragment = this._propertyTrigger(props);
      if (nextModelFragment) {
        this.justUpdateModel(nextModelFragment);
      }
    }
    this.props = props;
    this._recomputeProjectionAndPropagate();
  },
  genMarkup: function(idTreeSoFar, gen, events) {
    this._rootDomId = idTreeSoFar;
    return this._allocateChildrenGenMarkup(idTreeSoFar, gen, events);
  }
};

_Fax.universalPrivateMixins = {
  /**
   * Just updates the model without automatically reprojecting.
   */
  justUpdateModel: function(nextModelFragment) {
    _Fax.mergeStuff(this.model, nextModelFragment);
  },
  justUpdateModelDeep: function(nextModelFragment) {
    this.model = _Fax.mergeDeep(this.model, nextModelFragment);
  },

  /**
   * Nice way to define a function literal, that when invoked, updates the
   * model, causing a reprojection.
   * var button = {
   *   onClick: this.updater( {hasButtonBeenClicked: true} )
   * }.Button();
   */
  updater: function(fragLiteral) {
    var that = this;
    return function() {
      that.updateModel(fragLiteral);
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
  updateModel: function(nextModelFragment) {
    if (this.lock) {
      throw "Cannot props state before your done projecting!!";
    }
    this.justUpdateModel(nextModelFragment);
    this._recomputeProjectionAndPropagate();

    /* Since updateModel is the top level orchestrator of propagation data down
     * the tree, it should be responsible for executing the work queue. */
    Fax.executePostProjectionQueue();
    return true;
  },

  updateModelDeep: function(nextModelFragment) {
    if (this.lock) {
      throw "Cannot props state before your done projecting!!";
    }
    this.justUpdateModelDeep(nextModelFragment);
    this._recomputeProjectionAndPropagate();

    /* Since updateModel is the top level orchestrator of propagation data down
     * the tree, it should be responsible for executing the work queue. */
    Fax.executePostProjectionQueue();
    return true;
  },

  _reproject: function() {
    this._recomputeProjectionAndPropagate();
  },

  /**
   * To be implemented: Should accept a string
   * 'projection.contained.1.contained' This is a can of worms, and encourages a
   * paradigm that I'm choosing not to focus on for the time being. However, it
   * would be great if someone implemented something like this for the rare
   * cases where declarative programming isn't as easy or concise.
   */
  _childAt: function(s) {
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
  for (var i=0; i < arr1.length; i++) {
    for (var j=0; j < arr2.length; j++) {
      handler(arr1[i], arr2[j]);
    }
  }
};

/**
 * Accepts an object, and for each own property, calls mapper, while
 * constructing an array to return.
 */
_Fax.objMapToArray = function(obj, mapper) {
  var ret = [], aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey)) {
      ret.push(mapper(obj[aKey], aKey));
    }
  }
  return ret;
}

/**
 * Mapper must return {key: x, value: y} If mapper returns undefined, no entry
 * in the ret will be made.  It must not return null.
 */
_Fax.arrayMapToObj = function(arr, mapper) {
  var ret = {}, res;
  for (var i = arr.length - 1; i >= 0; i--) {
    res = mapper(arr[i], i);
    ret[res.key] = res.value;
  }
  return ret;
}


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
_Fax.objExclusion = function(obj, filterOutMap) {
  var ret = {}, filterOutMap = filterOutMap || {}, aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey) && !filterOutMap[aKey]) {
      ret[aKey] = obj[aKey];
    }
  }
  return ret;
};


_Fax.copyProps = function(obj, obj2) {
  for (var key in obj2) {
    if (!obj2.hasOwnProperty(key)) {
      continue;
    }
    obj[key] = obj2[key];
  }
  return obj;
};

_Fax.shallowClone = function(obj) {
  return Fax.copyProps({}, obj);
};

/**
 * Fax.multiComponentMixins
 */
_Fax.multiComponentMixins = {
  _recomputeProjectionAndPropagate: function() {
    var childKey, child, projection;
    projection = this.props;
    for (childKey in this.children) {
      if (!this.children.hasOwnProperty(childKey)) {
        continue;
      }

      child = this.children[childKey];
      child.doControl(projection[childKey].props);
    }
  },
  _allocateChildrenGenMarkup: function(idSpaceSoFar, gen, events) {
    var projection, childKey, child, markupAccum, newChild;
    markupAccum = '';
    this.children = {};
    projection = this.props;   // the projection is the props!
    for (childKey in projection) {
      if (!this.props.hasOwnProperty(childKey)) { continue; }
      newChild =
          new projection[childKey].maker(projection[childKey].props);
      markupAccum += newChild.genMarkup(
          idSpaceSoFar+('.' + childKey), gen,
          events);
      this.children[childKey] = newChild;
    }
    return markupAccum;
  },
  project: function() {
    return this.props;
  }
};


/**
 * Fax.standardComponentMixins
 */
_Fax.standardComponentMixins = {
  _recomputeProjectionAndPropagate: function() {
    this.child.doControl(this._getProjection().props);
    if (this.postProjection) {
      Fax.postProjectionDelegateQueue.push(this);
    }
  },
  _allocateChildrenGenMarkup: function(idSpaceSoFar, gen, events) {
    if (this.onDomReady) {
      Fax.onDomReadyDelegateQueue.push(this);
    }
    if (this.postProjection) {
      Fax.postProjectionDelegateQueue.push(this);
    }
    var projection = this._getProjection();
    this.child = new projection.maker(projection.props);
    return this.child.genMarkup(idSpaceSoFar, gen, events);
  },
  _getProjection: function() {
    this.lock = true;
    var projection = this.project();
    this.lock = false;
    return projection;
  },
  _controlDomNode: function (path, domAttrs) {
    var normalized = path.replace('projection', '');
    var elem = document.getElementById(this._rootDomId + normalized);
    _Fax.controlPhysicalDomNode(elem, domAttrs);
  },
  _childDom: function (path) {
    var normalized = path.replace('projection', '');
    return document.getElementById(this._rootDomId + normalized);
  }
};

/**
 * Fax.orderedComponentMixins: A component that houses an array of components,
 * each having the same 'type'.  Manages construction/destruction of DOM
 * elements in an inneficient manner.  This should only be used with an array
 * projection of components for which each element is the exact same type
 * (accepts the same props) and where each element is indistinguishable from the
 * others (each holds no state.)
 */
_Fax.orderedComponentMixins = {

  /**
   * At this point, this.children is as before appending or deleting any
   * children, but props is the new properties.  TODO: get this to work with
   * i.e. table elements
   */
  _recomputeProjectionAndPropagate: function() {
    var child, projection, newMarkup;
    projectionToReconcile = this.props;
    var numAlreadyExistingThatShouldRemain =
        Math.min(this.children.length, projectionToReconcile.length);
    for (var jj = 0; jj < numAlreadyExistingThatShouldRemain; jj++) {
      child = this.children[jj];
      child.doControl(projectionToReconcile[jj].props);
    }

    /**
     * Delete all material that that has been lost.
     */
    for (var ii = projectionToReconcile.length; ii < this.children.length; ii++) {
      var domNodeToRemove = document.getElementById(this._rootDomId + '.' + ii);
      if (!domNodeToRemove) {
        _Fax.Error("No DOM node to hide!");
      }
      domNodeToRemove.parentNode.removeChild(domNodeToRemove);
    }

    /*
     * Allocate new material. #todoie, #todoreplacewithframework
     * http://stackoverflow.com/questions/494143/
     * how-do-i-create-a-new-dom-element-from-an-html-string-using-built-in-dom-methods
     */
    for (var kk = numAlreadyExistingThatShouldRemain; kk < projectionToReconcile.length; kk++) {
      newChild = new (projectionToReconcile[kk].maker)(projectionToReconcile[kk].props);
      newMarkup = newChild.genMarkup(this._rootDomId + ('.' + kk), true, true);
      this.children[kk] = newChild;
      Fax.appendMarkup(document.getElementById(this._rootDomId), newMarkup);
    }
    Fax.executeDomReadyQueue(); // because we added dom content
    Fax.executePostProjectionQueue();
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
  _allocateChildrenGenMarkup: function(idSpaceSoFar, gen, events) {
    var jj, projection, childKey, child, markupAccum, newChild;
    markupAccum = '<div id="' + idSpaceSoFar + '" style="display:inherit">';
    projection = this.props;   // the projection is the props!
    this.children = [];
    for (jj = 0; jj < projection.length; jj++) {
      newChild = new (projection[jj].maker)(projection[jj].props);
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
 * Several different types of components may have multiple children keyed by
 * name Ideally they could all mix these in and apply any type specifics on top.
 * Helper methods modeled as mixins. This entire set of mixins has so much
 * overlap with the native dom component mixins. We are not intentionally
 * factoring out the commonalities because that would slow down the performance
 * of these super critical functions. We are careful to keep all similar parts
 * of the code textually identical to help with gzip compression, so there is no
 * downside to the redundancy except code maintainability. Need javascript
 * macros.
 * required type: {
 *   children: {childName: childInstance, ... }
 *   props: {properties}
 * }
 */
_Fax.multiChildMixins = {
  _allocateChildrenGenChildMarkup: function(idSpaceSoFar, gen, events) {
    var projection, childKey, markupAccum = '', newChild;
    projection = this.props;   // the projection is the props!
    this.children = {};
    var childComponents = this.children;
    for (childKey in projection) {
      if (!projection.hasOwnProperty(childKey)) { continue; }
      var childProjection = projection[childKey];
      newChild = new (childProjection.maker)(childProjection.props);
      markupAccum += newChild.genMarkup(idSpaceSoFar + ('.' + childKey), gen, events);
      childComponents[childKey] = newChild;
    }
    return markupAccum;
  },
  _recomputeProjectionAndPropagate: function() {
    var deallocateChildren = {};
    var keepChildrenInstances = {};
    var projectionToReconcile = this.props;
    var newMarkup, childComponents = this.children;
    var parentDomNode = document.getElementById(this._rootDomId);

    for (var currentChildKey in childComponents) {
      if (!childComponents.hasOwnProperty(currentChildKey)) { continue; }

      var currentChildComponent = childComponents[currentChildKey];
      var newProjection = projectionToReconcile[currentChildKey];
      /* May as well control them now while we have them. */
      if(currentChildComponent && newProjection && newProjection.maker &&
         newProjection.maker === currentChildComponent.constructor) {
         /* where the new child is a component, and appears to be the same as the
          * previous child, let's just control what's there.*/
        keepChildrenInstances[currentChildKey] = currentChildComponent;
        currentChildComponent.doControl(newProjection.props);
      } else {
        /**
         * Otherwise: Ensure no resources for this child, whether or not there
         * ever were any to begin with. This child may have been null, or not a
         * real component.
         */
        /* Otherwise, we have the same name but different type. It likely
         * even have the same interface. It's not even clear what to
         * do here. I would opt for eventually saying if the child is named
         * the exact same, then they need to have the exact same 'type'.
         * If there's different subtypes etc, you should put them in a
         * different child key that is conditionally included in the
         * projection.
         * This child should not only go away (have resources deallocated)
         * but also be recreated. It may have been falsey in the first place
         * in which case it will be idempotently deleted before recreating.
         * #todoapi: Should we do something similar as all of this with high
         * level components?
         */
        deallocateChildren[currentChildKey] = currentChildComponent;
      }
    }

    /** Delete all material that that has been lost.  */
    for (var deallocateChildKey in deallocateChildren) {
      if (!deallocateChildren.hasOwnProperty(deallocateChildKey)) {
        continue;
      }

      var deallocateChild = childComponents[deallocateChildKey];

      /* Child component looking like an actual component is sign that there
       * were dom resources to clean up. Child components may actually just be
       * null, or may be crazy things stored just to preserve order for the day
       * when these children actually do become real components. */
      if(deallocateChild && deallocateChild.doControl) {
        var domNodeToRemove =
            document.getElementById(this._rootDomId + '.' + deallocateChildKey);
        domNodeToRemove.parentNode.removeChild(domNodeToRemove);
        delete childComponents[deallocateChildKey];
      }
    }

    var newChildren = keepChildrenInstances;
    var lastIteratedDomNode = null; // dom node of previous sibling or null
    for (var projectionKey in projectionToReconcile) {
      if (!projectionToReconcile.hasOwnProperty(projectionKey)) {
        continue;
      }
      var projectionForKey = projectionToReconcile[projectionKey];

      if (!childComponents[projectionKey]) {
        if (projectionForKey && projectionForKey.maker) {
          // If there's not yet a child and we want to allocate a component
          newChild = new (projectionForKey.maker)(projectionForKey.props);
          newMarkup =
              newChild.genMarkup(this._rootDomId + ('.' + projectionKey), true, true);
          childComponents[projectionKey] = newChild;
          var newDomNode = Fax.singleDomNodeFromMarkup(newMarkup);
          lastIteratedDomNode = Fax.insertNodeAfterNode(parentDomNode, newDomNode, lastIteratedDomNode);
        } else {
          /* Else, the child component is nullish, or not a real component.
           * Just add it to the children list to preserve order, in case it
           * becomes a real dom element when it grows up.*/
          childComponents[projectionKey] = projectionForKey;
        }
      } else {
        // Else there is already a child, it may have a dom element associated
        // with it so let's try to set our last iterated.
        lastIteratedDomNode =
            document.getElementById(this._rootDomId + '.' + projectionKey) ||
              lastIteratedDomNode;
      }
    }

    Fax.executeDomReadyQueue(); // because we added dom content
    Fax.executePostProjectionQueue();
  },
  project: function() {
    return this.props;
  }
};


/**
 * MultiDynamic Component Mixins: currently the only client of the
 * multiChildMixins, but that could change soon.
 */
_Fax.multiDynamicComponentMixins = {
  _recomputeProjectionAndPropagate:
      _Fax.multiChildMixins._recomputeProjectionAndPropagate,
  _allocateChildrenGenMarkup: function(idSpaceSoFar, gen, events) {
    return '<div id="' + idSpaceSoFar + '" style="display:inherit">' +
        _Fax.multiChildMixins._allocateChildrenGenChildMarkup
            .call(this, idSpaceSoFar, gen, events) +
        "</div>";
  },

  project: function() {
    return this.props;
  }
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
  var ret = {};
  for (var memberName in obj) {
    if (!obj.hasOwnProperty(memberName)) {
      continue;
    }
    var potentialComponent = obj[memberName];
    if (potentialComponent &&
        typeof potentialComponent != 'function' &&
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
 * _Fax.controlPhysicalDomNode: Useful when you have a dom node and a set of
 * properties, and want to control the entire node based on those properties.
 * This doesn't reconcile event handlers, just the physical dom node.
 */
_Fax.controlPhysicalDomNode = function (elem, nextProps) {
  var styleAttr, styleAttrVal, nextPropsStyleAttrVal, logStyleAttrName,
      style = nextProps.style;

  for (var propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    var prop = nextProps[propKey];
    if (propKey === 'style') {
      elem.cssText = _serializeInlineStyle(prop);
    } else if (_controlUsingSetAttrDomAttrsMap[propKey]) {
      elem.setAttribute(_controlUsingSetAttrDomAttrsMap[propKey],
          FaxUtils.escapeTextNodeForBrowser(prop));
    } else if (_Fax.controlDirectlyDomAttrsMap[propKey]) {
      elem[_Fax.controlDirectlyDomAttrsMap[propKey]] =
          FaxUtils.escapeTextNodeForBrowser(prop);
    }
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
 *   onClick:     fn  (top level event delgation)
 *   onMouseUp:   fn
 *   onMouseDown: fn
 *   onMouseIn:   fn
 *
 * Most dom attributes are readable and controllable, but some such as 'value'
 * are only renderable, and cannot continue to be controlled. There is a
 * standard FWidgets text box that solves that inconsistency at a higher level:
 *   width:       create/controlled tag attribute
 *   height:      create/controlled tag attribute
 *   clss:        create/controlled tag attribute
 *   value:       only   controlled tag attribute
 *   (many more):   see controlUsingSetAttrDomAttrsMap/markupDomTagAttrsMap
 *
 * Each native dom tag component accepts a style property:
 *   style: {width , height, .. }
 *
 * All native tag components can contain any amount of child components. The
 * parent of the native tag component should just drop children in under any
 * name they wish in the properties, right along side style and event handlers,
 * so long as that name does not conflict with width/clss/onClick etc..  We also
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
 */
function _makeDomContainerComponent(tag, optionalTagTextPar, pre, post, headText, footText) {
  var optionalTagText = optionalTagTextPar ? ' unselectable=on' + optionalTagText : '';
  var tagOpen = (pre || '') + "<" + tag + optionalTagText + " id='";
  var tagClose = (footText || '') + "</" + tag + ">" + (post || '');
  var headTextTagClose = ">" + (headText || '');

  var ProjectingConstructor = function(propsParam) {
    var props = propsParam ||  this;
    return {
      props: props,
      maker: NativeComponentConstructor
    };
  };

  var NativeComponentConstructor = function(initProps) {
    this._rootDomId = null;
    this._currentProps = initProps;
    this.children = {};
  };

  /**
   * Reregister the event handlers just in case an update happened to something
   * that someone 'closed' in a closure and expected to be updated #todoperf:
   * not sure what can be done. Possibly two-piece cocoa style delegation (a
   * target and a method to invoke from prototype). The reason why we always
   * reregister the handlers, is that someone may have specified a handler that
   * traps some intermediate variable in it's closure and data is out of sync:
   * var stateMember = this.model.stateMember;
   * var b = {
   *   onClick: function() { alert(stateMember); }
   * }.Button()
   * In the projecting api, if someone updates this.model.stateMember, the only
   * way for that handler to always alert the real stateMember is to reproject
   * and retrap the latest value in it's closure. Requiring class method handles
   * gets around this because object (as in OO) are really just 'well
   * understood' closures and can accomplish redirection that is never stale
   * through the 'this' keyword (because that's your only option).
   *
   * #todocontrol: when a updateModel happens we refresh everything under the
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
    if (!this._rootDomId) { throw "Trying to control a native dom element without a backing id"; }

    /**In the context of a native dom component - the instance of this child and
     * it's associated dom resources should be deallocated before possible being
     * reallocated as a new instance type.*/
    var deallocateChildren = {};
    var keepChildrenInstances = {};
    var projectionToReconcile = nextProps;
    var newMarkup, childComponents = this.children;
    var parentDomNode = document.getElementById(this._rootDomId);

    this.lastProps = nextProps;
    // #differentThanMultiChildMixins - control parent, props, registerHandlers
    _Fax.controlPhysicalDomNode(parentDomNode, nextProps);
    this._currentProps = nextProps;
    FaxEvent.registerHandlers(this._rootDomId, nextProps);
    if (nextProps.handlers) {
      FaxEvent.registerHandlers(this._rootDomId, nextProps.handlers);
    }


    /** This code is largely duplication of what is in the MultiChildMixins, with
     * the exception that we filter out particular elements. We could factor out
     * common code, but this is such a critical path that the duplication is
     * worth the performance gain. Not only do we filter out special keys, but
     * also filter out falsey children, and deallocating their dom resources. */
    for (var currentChildKey in childComponents) {
      if (!childComponents.hasOwnProperty(currentChildKey)) { continue; }

      var currentChildComponent = childComponents[currentChildKey];
      var newProjection = projectionToReconcile[currentChildKey];
      /* May as well control them now while we have them. */
      if(currentChildComponent && newProjection && newProjection.maker &&
         newProjection.maker === currentChildComponent.constructor) {
         /* where the new child is a component, and appears to be the same as the
          * previous child, let's just control what's there.*/
        keepChildrenInstances[currentChildKey] = currentChildComponent;
        currentChildComponent.doControl(newProjection.props);
      } else {
        /**
         * Otherwise: Ensure no resources for this child, whether or not there
         * ever were any to begin with. This child may have been null, or not a
         * real component.
         */
        /* Otherwise, we have the same name but different type. It likely
         * even have the same interface. It's not even clear what to
         * do here. I would opt for eventually saying if the child is named
         * the exact same, then they need to have the exact same 'type'.
         * If there's different subtypes etc, you should put them in a
         * different child key that is conditionally included in the
         * projection.
         * This child should not only go away (have resources deallocated)
         * but also be recreated. It may have been falsey in the first place
         * in which case it will be idempotently deleted before recreating.
         * #todoapi: Should we do something similar as all of this with high
         * level components?
         */
        deallocateChildren[currentChildKey] = currentChildComponent;
      }
    }

    /** Ensure that no-longer-existing children resources are deallocated. */
    for (var deallocateChildKey in deallocateChildren) {
      if (!deallocateChildren.hasOwnProperty(deallocateChildKey)) {
        continue;
      }
      var deallocateChild = childComponents[deallocateChildKey];
      /* Child component looking like an actual component is sign that there
       * were dom resources to clean up. Child components may actually just be
       * null, or may be crazy things stored just to preserve order for the day
       * when these children actually do become real components. */
      if(deallocateChild && deallocateChild.doControl) {
        var domNodeToRemove =
            document.getElementById(this._rootDomId + '.' + deallocateChildKey);
        domNodeToRemove.parentNode.removeChild(domNodeToRemove);
        delete childComponents[deallocateChildKey];
        /**
         * TODO: Deallocate all handlers for this destoyed dom object. The dom
         * isn't going to help us out here, because we stored them at the top level!
         */
      }
    }

    var newChildren = keepChildrenInstances;
    var lastIteratedDomNode = null;
    for (var projectionKey in projectionToReconcile) {
      if (!projectionToReconcile.hasOwnProperty(projectionKey)) {
        continue;
      }
      var projectionForKey = projectionToReconcile[projectionKey];

      // #differentThanMultiChildMixins: ALL of this filtering.
      // Check for native attributes and apply them to the dom.
      var childControllableDomAttr = _controlUsingSetAttrDomAttrsMap[projectionKey];
      if (childControllableDomAttr) {
        parentDomNode.setAttribute(
            childControllableDomAttr,
            FaxUtils.escapeTextNodeForBrowser(projectionForKey));
      } else if (_Fax.controlDirectlyDomAttrsMap[projectionKey]) {
        parentDomNode[_Fax.controlDirectlyDomAttrsMap[projectionKey]] =
          FaxUtils.escapeTextNodeForBrowser(projectionForKey);
      } else if (projectionKey === 'style') {
        for (var logStyleAttrName in projectionForKey) {
          if (!projectionForKey.hasOwnProperty(logStyleAttrName) ||
               projectionForKey[logStyleAttrName] === undefined) { continue; }
          parentDomNode.style[_styleAttrNameForLogicalName(logStyleAttrName)] =
            _styleValue(logStyleAttrName, projectionForKey[logStyleAttrName]);
        }
      } else if (!childComponents[projectionKey]) {
        if (projectionForKey && projectionForKey.maker) {
          // If there's not yet a child and we want to allocate a component
          newChild = new (projectionForKey.maker)(projectionForKey.props);
          newMarkup =
              newChild.genMarkup(this._rootDomId + ('.' + projectionKey), true, true);
          childComponents[projectionKey] = newChild;
          var newDomNode = Fax.singleDomNodeFromMarkup(newMarkup);
          lastIteratedDomNode = Fax.insertNodeAfterNode(parentDomNode, newDomNode, lastIteratedDomNode);
        } else {
          /* Else, the child component is nullish, or not a real component.
           * Just add it to the children list to preserve order, in case it
           * becomes a real dom element when it grows up.*/
          childComponents[projectionKey] = projectionForKey;
        }
      } else {
        // Else there is already a child, it may have a dom element associated
        // with it so let's try to set our last iterated.
        lastIteratedDomNode =
            document.getElementById(this._rootDomId + '.' + projectionKey) ||
              lastIteratedDomNode;
      }
    }
    /**
     * Because we added dom content, #todoimmediately: #todoapi only the top
     * level renderer/controlment should do this.  Otherwise we're calling this
     * at every level. Noone is using this yet.
     */
    Fax.executeDomReadyQueue();
    Fax.executePostProjectionQueue();
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
  NativeComponentConstructor.prototype.genMarkup =
      function(idTreeSoFar, shouldGenMarkup, shouldRegHandlers) {
    var containedIdRoot, newComponent, propKey, prop, childrenAccum = '', tagAttrAccum = '',
        currentProps = this._currentProps, containedComponents = this.children;
    this._rootDomId = idTreeSoFar;
    var header = tagOpen + idTreeSoFar + "' ";

    for (propKey in currentProps) {
      if (!currentProps.hasOwnProperty(propKey)) { continue; }

      prop = currentProps[propKey];
      if (shouldRegHandlers) {
        if (typeof prop ===  'function') {
          FaxEvent.registerHandlerByName(idTreeSoFar, propKey, prop);
        } else if (propKey === 'handlers' && prop) {
          FaxEvent.registerHandlers(idTreeSoFar, prop);
        }
      }
      if (shouldGenMarkup && prop) {
        if (propKey === 'style') {
          tagAttrAccum += _tagStyleAttrFragment(prop);
        } else if (_Fax.markupDomTagAttrsMap[propKey]) {
          tagAttrAccum += _tagDomAttrMarkupFragment(propKey, prop);
        } else if (prop.maker) {
          containedIdRoot = idTreeSoFar + '.' + propKey;
          newComponent = new (prop.maker)(prop.props);
          containedComponents[propKey] = newComponent;
          childrenAccum += newComponent.genMarkup(
              containedIdRoot,
              shouldGenMarkup,
              shouldRegHandlers);
        } else if(prop === null) {
          /* The placeholder preserves order of children in the event that we
           * later decide to have something here. This allows clients to
           * conditionally include children but decide their placement. */
          containedComponents[propKey] = null;
        } else if (propKey === 'innerHtml') {
          childrenAccum += _innerHtmlMarkupFragment(prop);
        } else {
          /* Probably something that was just included due to mixing in.
           * We duck type in general, it's okay to include more than what is
           * supported, if it is convenient.*/
        }
      } else if (prop && prop.maker) {
        containedIdRoot = idTreeSoFar + '.' + propKey;
        newComponent = new (prop.maker)(prop.props);
        containedComponents[propKey] = newComponent;
        newComponent.genMarkup(containedIdRoot, shouldGenMarkup, shouldRegHandlers);
        return null;
      }
    }
    if (shouldGenMarkup) {
      return header + tagAttrAccum + headTextTagClose + childrenAccum + tagClose;
    } else {
      return null;
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
    _Fax.Error("Namespace is falsey wtf!");
  }
  var _appendAll = function() {
    for (var i=0; i < uiPackages.length; i++) {
      var uiPackage = uiPackages[i];
      for (var uiComponent in uiPackages[i]) {
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

var updater = function(queue, literal) {
  return function() {
    queue.push(literal);
  };
};

_Fax.using = function() {
  var uiPackages = [];
  for (var i=0; i < arguments.length; i++) {
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
  var doesntHave = [];
  for (var jj = propsArr.length - 1; jj >= 0; jj--) {
    if(!obj.hasOwnProperty([propsArr[jj]])) {
      doesntHave.push(propsArr[jj]);
    }
  }
  if (doesntHave.length !== 0) {
    throw "Properties not present:" + _ser(propsArr);
  }
};

/**
 * Probably better than prototypical extension because we can reason about
 * nullness more gracefully. This version just takes one in the construction
 * because arguments access can be very slow.
 */
var _curryOne = function(func, val) {
  if (!func) { return null;
  }
  return function() {
    var newArgs = [val];
    for (var i = arguments.length - 1; i >= 0; i--) {
      newArgs.push(arguments[i]);
    }
    func.apply(null, newArgs);
  };
};

/**
 * When generating markup, the Fax mixins will ensure that all objects that need
 * to be notified of a Dom Ready event are notified. Anyone who appends content
 * to the dom (that is a result of genMarkup) should call this, so that
 * components that need to perform some dom initialization, may do so. Also
 * anyone who executes doControl at the topmost level must also call this.
 */
var _executeDomReadyQueue = function () {
  for (var ii=0; ii < Fax.onDomReadyDelegateQueue.length; ii++) {
    Fax.onDomReadyDelegateQueue[ii].onDomReady();
  }
  Fax.onDomReadyDelegateQueue = [];
};

var _executePostProjectionQueue = function () {
  for (var ii=0; ii < Fax.postProjectionDelegateQueue.length; ii++) {
    Fax.postProjectionDelegateQueue[ii].postProjection();
  }
  Fax.postProjectionDelegateQueue = [];
};

/**
 * Does not work correctly with tables etc.
 */
var _appendMarkup = function (elem, newMarkup) {
  var div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (var elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--){
    elem.appendChild(elements[elemIdx]);
  }
};
/**
 * Does not work correctly with tables etc.
 */
var _singleDomNodeFromMarkup = function (newMarkup) {
  var div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (var elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--){
    return elements[elemIdx];
  }
  throw "Could not create single dom node";
};

var _appendNode = function (elem, node) {
   elem.appendChild(node);
};

/**
 * Inserts node before insertBeforeNode. If insertBeforeNode is null, inserts it
 * before nothing, which is inserting it at the end.
 */
var _insertNodeBeforeNode = function (elem, insertNode, insertBeforeNode) {
   return elem.insertBefore(insertNode, insertBeforeNode);
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

var _str = function(str) {
  return str ? str : '';
};

/**
 * Little helper, takes a map from class name to boolean and returns a string
 * for use as a dom elements 'class' property.  Slow because it needs to
 * concatenate spaces. Leaves a space at the end of the class string so it is
 * easy to append to. If prototypes are crufty due to extending
 * Object.prototype, use fastClssMap.
 */
var _clssMap = function(map) {
  var accum = '';
  for (var clssName in map) {
    if (!map.hasOwnProperty(clssName)) {
      continue;
    }
    if (map[clssName]) {
      accum += clssName + ' ';
    }
  }
  return accum;
};

/**
 * Takes a set of classes in map form, concatenating the truthy class values
 * together to form a single class string. Maintains a trailing space at the end
 * so you can easily add additional classes. A nice way to string together class
 * strings when there are several things that determine what should be included.
 * var clssString =
 *  Fax.clssSet({
 *    ClassOne: true,                  // Will append 'ClassOne'
 *    userProvidedClss: this.userClss, // Appends this.userClss if it's truthy
 *    disabled: !!this.shouldDisable   // appends 'disabled' iff this.shouldDisable
 *    enabled: !this.shouldDisable     // appends 'enabled' iff !this.shouldDisable
 *  });
 */
_Fax.clssSet = function(namedSet) {
  var accum = '';
  for (var nameOfClass in namedSet) {
    if (!namedSet.hasOwnProperty(nameOfClass)) {
      continue;
    }
    var val = namedSet[nameOfClass];
    if(val === true || val === 1) {
      accum += nameOfClass + ' ';
    } else if(nameOfClass && val) {
      accum += val;
    }
  }
  return accum;
};


/**
 * Constructs a single class string suitable for dom object property, skipping
 * over undefined and null references, so that it can be used as a convenient
 * class constructor.  var clssString = Fax.clssList([obj.one,
 * another.dontKnowIfThisIsDefined]);
 */
var _clssList = function (clssList) {
  var accum = '';
  for (jj = clssList.length - 1; jj >= 0; jj--) {
    // Don't skip over the number zero.
    if (clssList[jj] !== undefined && clssList[jj] !== null) {
      accum += clssList[jj] + ' ';
    }
  }
  return accum;
};

/**
 * Accepts an optional array of class names to slice off of the object for
 * inspection. Helpful when Object.prototype has several things appended to it
 * and iterating/checking own object is slow.  Also, it allows you to construct
 * the map once and slice off different classes onto different dom nodes
 * easilly. Just use clssMap if code compiled with FaxOptimizer - no prototype
 * cruft.
 * Fax.fastClssMap([' hdn', ' bigThing'], {
 *    hdn: true,
 *    bigThing: !!this.x
 * });
 */
var _fastClssMap = function(thing1, thing2) {
  var map, clssList, jj, accum = '';
  if (thing1 && !thing2) {
    map = thing1;
    clssList = null;
  } else {
    map = thing2;
    clssList = thing1;
  }
  if (!clssList) {
    return _clssMap(map);
  } else {
    for (jj = clssList.length - 1; jj >= 0; jj--) {
      if (map[clssList[jj]]) {
        accum += clssList[jj] + ' ';
      }
    }
    return accum.substr(0, accum.length - 1);
  }
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

/*
 * Fax.newPosInfoRelativeTo - operates on css'y attributes not (t,l,r,b,w,h)
 * should modify to make it only support that position form.
 */
_Fax.newPosInfoRelativeTo = function(outer, inner) {
  outer = outer || {};
  inner = inner || {};
  var ret = {};
  if (inner.hasOwnProperty('left')) {
    ret.left = inner.left.charAt ? 'noocompute%' : (inner.left + (outer.left || 0));
  } else if (outer.hasOwnProperty('left')) {
    ret.left = outer.left;
  }
  if (inner.hasOwnProperty('top')) {
    ret.top = inner.top.charAt ? 'noocompute%' : (inner.top + (outer.top || 0));
  } else if (outer.hasOwnProperty('top')) {
    ret.top = outer.top;
  }
  if (inner.hasOwnProperty('bottom')) {
    ret.bottom = inner.bottom.charAt ? 'noocompute%' : (inner.bottom + (outer.bottom || 0));
  } else if (outer.hasOwnProperty('bottom')) {
    ret.bottom = outer.bottom;
  }
  if (inner.hasOwnProperty('right')) {
    ret.right = inner.right.charAt ? 'noocompute%' : (inner.right + (outer.right || 0));
  } else if (outer.hasOwnProperty('right')) {
    ret.right = outer.right;
  }
  if (inner.hasOwnProperty('width')) {
    ret.width = inner.width;
  } else if (outer.hasOwnProperty('width')) {
    ret.width = outer.width;
  }
  if (inner.hasOwnProperty('height')) {
    ret.height = inner.height;
  } else if (outer.hasOwnProperty('height')) {
    ret.height = outer.height;
  }
  if (inner.hasOwnProperty('z-index')) {
    ret['z-index'] = inner['z-index'] + (outer['z-index'] || 0) ;
  } else if (outer.hasOwnProperty('z-index')) {
    ret['z-index'] = outer['z-index'];
  }
  return ret;
};

/**
 * Fax.objMap
 */
_Fax.objMap = function (obj, fun) {
  if (!obj) {
    return obj;
  }
  var ret = {};
  var i = 0;
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = fun(key, obj[key], i++);
  }
  return ret;
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
  var mapped;
  if (!obj) {
    return obj;
  }
  var ret = {};
  for (var key in obj) {
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


/**
 * This is to help browserify's cache not break.
 */
if (typeof Fax === 'object') {
    module.exports = Fax;
} else {
  Fax = {
    _eventsById: FaxEvent.eventsById,
    curryOne: _curryOne,
    stringSwitch: _Fax.stringSwitch,
    MakeComponentClass: _Fax.MakeComponentClass,
    MakeDeepFreezeComponent: _Fax.MakeDeepFreezeComponent,
    Componentize: _Fax.Componentize,
    ComponentizeAll: _Fax.ComponentizeAll,
    forceClientRendering: true,
    renderAt: _Fax.renderAt,
    renderTopLevelComponentAt: _Fax.renderTopLevelComponentAt,
    registerTopLevelListener: _Fax.registerTopLevelListener,
    maybeInvoke: _Fax.maybeInvoke,
    str: _str,
    makeDomContainerComponent: _makeDomContainerComponent,
    allTruthy: _Fax.allTruthy,
    crossProduct: FaxUtils.crossProduct,
    extractCssPosInfo: _Fax.extractCssPosInfo,
    extractPosInfo: _Fax.extractPosInfo,
    sealPosInfo: _Fax.sealPosInfo,
    extractAndSealPosInfo: _Fax.extractAndSealPosInfo,
    newPosInfoRelativeTo: _Fax.newPosInfoRelativeTo,
    objMap: _Fax.objMap,
    objMapToArray: _Fax.objMapToArray,
    objMapFilter: _objMapFilter,
    arrayMapToObj: _Fax.arrayMapToObj,
    keys: _Fax.keys,
    keyCount: _Fax.keyCount,
    objSubset: _Fax.objSubset,
    exclusion: _Fax.exclusion,
    objExclusion: _Fax.objExclusion,
    using: _Fax.using,
    populateNamespace: null,
    copyProps: _Fax.copyProps,
    shallowClone: _Fax.shallowClone,
    sure: _sure,
    STRETCH: {top: 0, left: 0, right: 0, bottom: 0, position: 'absolute'},
    onDomReadyDelegateQueue: [],
    postProjectionDelegateQueue: [],
    executeDomReadyQueue: _executeDomReadyQueue,
    executePostProjectionQueue: _executePostProjectionQueue,
    appendMarkup: _appendMarkup,
    singleDomNodeFromMarkup: _singleDomNodeFromMarkup,
    appendNode: _appendNode,
    insertNodeBeforeNode: _insertNodeBeforeNode,
    insertNodeAfterNode: _insertNodeAfterNode,
    clssMap: _clssMap,
    clssSet: _Fax.clssSet,
    fastClssMap: _fastClssMap,
    clssList: _clssList,
    merge: _Fax.merge,
    mergeThree: _Fax.mergeThree,
    mergeDeep: _Fax.mergeDeep,
    mergeStuff: _Fax.mergeStuff,
    mergeThis: _Fax.mergeThis,
    mergeReturn: _Fax.mergeReturn,
    multiComponentMixins: _Fax.multiComponentMixins,
    orderedComponentMixins: _Fax.orderedComponentMixins,
    multiDynamicComponentMixins: _Fax.multiDynamicComponentMixins,
    implicitChildrenRect: _Fax.implicitChildrenRect,
    getViewportDims: FaxUtils.getViewportDims,
    styleAttrNameForLogicalName: _styleAttrNameForLogicalName,
    serializeInlineStyle: _serializeInlineStyle,
    clone: _clone,
    POS_KEYS: {l:true, h:true, w:true, r:true, b:true, t:true },
    POS_CLSS_KEYS: {l:true, h:true, w:true, r:true, b:true, t:true, clssSet: true },
    TextNode: _Fax.TextNode
  };

  module.exports = Fax;
}

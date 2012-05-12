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
 * @FDomAttributes: Module for reasoning about dom attributes and rendering
 * these attributes into markup or interfacing with the dom in terms of these
 * logical attributes.
 *
 * #todoperf: I don't believe all marked as needing setAttribute actually need
 * to be controlled using setAttribute. setAttribute is slower than direct
 * access.
 */
var FBrowserUtils = require('./FBrowserUtils'),
    FUtils = require('./FUtils'),
    FEvent = require('./FEvent'),
    FEnv = require('./FEnv');

/*
 * Warm up sets with false literals for keys that tend to be names of children.
 */
var SET_MISS_WARM_UP = true;

if (typeof navigator !== 'undefined') {
  /* choose which way to update text in elements - N/A for node.js rendering */
  FEnv.ensureBrowserDetected();
  exports.CONTENT_ACCESSOR_KEY =
      FEnv.browserInfo.browser === 'Explorer' ? 'innerText' : 'textContent';
}


/*
 * ----------------------------------------------------------------------------
 * Attribute Naming:: We have logical names for attributes, and the versions
 * that the dom accepts.
 * ----------------------------------------------------------------------------
 */


/**
 * Resolved key names. (See keyOf).
 */
var T_KEY = FUtils.keyOf({ t: true });
var L_KEY = FUtils.keyOf({ l: true });
var B_KEY = FUtils.keyOf({ b: true });
var R_KEY = FUtils.keyOf({ r: true });
var H_KEY = FUtils.keyOf({ h: true });
var W_KEY = FUtils.keyOf({ w: true });


/*
 * A simple token to represent that the attribute name when communicating with
 * the dom should simply be a hyphenated version of the key. This saves a very
 * surprising amount of bytes. When using HYPHENIZE, the key must be something
 * that will not be ruined by minification. Most forms such as 'marginRight' are
 * actually preserved by key minification.  When not using HYPHENIZE, you must
 * include the string name of the dom attribute.
 * Todo: force even these keys to be renamed - referencing only an offset into
 * some getComputedStyle array so we won't need to pay the price of each of
 * these 'unminifiable' keys on each file/package.  Note: 'content' isn't key
 * minified
 */
var HYPHENIZE = 8, AS_IS = 9;
var DEFAULT_DOM_PROP = [HYPHENIZE, 0];
var AS_IS_PROP = [AS_IS, 0];
var renameByKey = function(prefix, suffix, propertyDescriptors) {
  return FUtils.objMap(propertyDescriptors, function(k, v) {
    return prefix +
           (v === HYPHENIZE ? FUtils.hyphenize(k) : v === AS_IS ? k : v) +
           suffix;
  });
};

/*
 * Css Attributes Interface: Enumeration of all valid properties, along with a
 * description of how they should be referenced when interfacing with the DOM.
 */
var styleFeatureNames = exports.styleFeatureNames = renameByKey(';', ':', {
  boxSizing: HYPHENIZE,
  transition: HYPHENIZE,
  boxShadow: HYPHENIZE,
  textShadow: HYPHENIZE,
  paddingRight: HYPHENIZE,
  paddingLeft: HYPHENIZE,
  paddingTop: HYPHENIZE,
  paddingBottom: HYPHENIZE,
  marginRight: HYPHENIZE,
  marginLeft: HYPHENIZE,
  marginTop: HYPHENIZE,
  marginBottom: HYPHENIZE,
  zIndex: HYPHENIZE,
  backgroundImage: HYPHENIZE,
  cursor: HYPHENIZE,
  direction: HYPHENIZE,
  border: HYPHENIZE,
  borderRadius: HYPHENIZE,
  fontSize: HYPHENIZE,
  fontWeight: HYPHENIZE,
  fontFamily: HYPHENIZE,
  lineHeight: HYPHENIZE,
  fontColor: HYPHENIZE,
  textTransform: HYPHENIZE,
  textDecoration: HYPHENIZE,
  textAlign: HYPHENIZE,
  borderLeft: HYPHENIZE,
  borderTop: HYPHENIZE,
  borderRight: HYPHENIZE,
  borderBottom: HYPHENIZE,
  borderColor: HYPHENIZE,
  position: HYPHENIZE,
  backgroundColor: HYPHENIZE,
  minHeight: HYPHENIZE,
  maxHeight: HYPHENIZE,
  minWidth: HYPHENIZE,
  maxWidth: HYPHENIZE,
  outline: HYPHENIZE,
  verticalAlign: HYPHENIZE
});

/* Set of attribute names for which we do not append 'px'. */
var cssNumber = exports.cssNumber = {
  textDecoration: true, zoom: true, fillOpacity: true,
  fontWeight: true, opacity: true, orphans: true,
  zIndex: true, outline: true
};


/*
 * Dom Element Attributes Interface:: Enumeration of all valid properties, along
 * with a description of how they should be referenced when interfacing with the
 * DOM.
 */
var allTagAttrPieces = exports.allTagAttrPieces = renameByKey('', '=\'', {
  /* These are always special cased when rendering or controlling. */
  classSet: 0,
  className: 0,
  dangerouslySetInnerHtml: 0,
  content: 0,
  posInfo: 0,
  dynamicHandlers: 0,

  margin: HYPHENIZE,
  marginRight: HYPHENIZE,
  marginLeft: HYPHENIZE,
  tabIndex: AS_IS,
  marginTop: HYPHENIZE,
  marginBottom: HYPHENIZE,
  padding: HYPHENIZE,
  paddingRight: HYPHENIZE,
  paddingLeft: HYPHENIZE,
  paddingTop: HYPHENIZE,
  paddingBottom: HYPHENIZE,
  width: HYPHENIZE,
  height: HYPHENIZE,
  href: HYPHENIZE,
  src: HYPHENIZE,
  value: HYPHENIZE,
  checked: HYPHENIZE,
  selected: AS_IS,
  target: AS_IS,
  scrollTop: AS_IS,
  scrollLeft: AS_IS,
  name: AS_IS,
  type: AS_IS,
  htmlFor: AS_IS,
  style: AS_IS
});


/**
 * Perf tip: It's faster to check for presence in a map when the values in that
 * map are exactly === true, vs. if they are "truthy" objects.  Similarly, it's
 * faster to discover that something is *not* a member of some set, if that set
 * explicitly declares that some key maps to false. So if you know you'll be
 * checking membership in these sets in performance critical paths, and you know
 * some of the keys that should not be found, you can store false for those keys
 * and get a perf boost http://jsperf.com/truthinessmaptest
 */
var allTagAttrsLookup = FUtils.objMap(allTagAttrPieces, FUtils.truther);

/**
 * ----------------------------------------------------------------------------
 * Categorization::
 * we categorize the Dom Attributes for quickly determining behavior at run
 * time.
 * ----------------------------------------------------------------------------
 */


/*
 * Set directly as a property on a physical dom node. Nothing special,
 * setAttribute is not required, and setting is idempotent.
 */
var controlSimply = exports.controlSimply = {
  scrollTop: true,
  scrollLeft: true
};

/**
 * These tend to be special cased in control paths. Content is escaped,
 * dangerouslySetInnerHtml is not. Only here for documentation purposes.
 */
var controlAsInnerMarkup = {
  content: true,
  dangerouslySetInnerHtml: true
};


/**
 * Properties that are not truly idempotent at the dom level, and therefore we
 * need to check their current values on the actual dom node before setting
 * them.  One example, is a text box value attribute. Setting the value will
 * reposition the cursor. Another example is src on an iframe - resetting it
 * will trigger a reload of the content and reflow. If we checked two in memory
 * representations before setting these, that would be sufficient. If that's
 * what happened all the time anyways, we wouldn't need to distinguish these as
 * being non-idempotent because it wouldn't be an issue.
 */
exports.controlDirectlyNonIdempotent = {
  value: true,
  src: true,
  checked: true,
  selected: true
};


/**
 * @controlUsingSetAttr: Logical attribute names that should be controlled via
 * setAttribute, as opposed to on the dom itself - we need to audit these to
 * ensure that it really is the case that we can't update the dom nodes
 * themselves - there would be big perf wins if that was tolerated.
 */
var controlUsingSetAttr = exports.controlUsingSetAttr = {
  margin: true,
  marginRight: true,
  marginLeft: true,
  marginTop: true,
  marginBottom: true,
  padding: true,
  paddingRight: true,
  paddingLeft: true,
  paddingTop: true,
  paddingBottom: true,
  width: true,
  height: true,
  className: true,
  href: true,
  target: true,
  classSet: true /* Special cased */
};


/**
 * @controlNever: Never controlled properties - these only make sense at
 * creation time.  Here for documentation purposes.
 */
var controlNever = {
  type: true,
  htmlFor: true
};

/**
 * @renderSimply: Dom attributes that are simply rendered as name="value" in the
 * opening tag. No escaping, no transforming, no placing as innerHtml of the dom
 * node, and the name is exactly indicated by the allTagAttrPieces map, with no
 * special casing done at render time.
 */
var renderSimply = exports.renderSimply = {
  margin: true,
  marginRight: true,
  marginLeft: true,
  tabIndex: true,
  marginTop: true,
  marginBottom: true,
  padding: true,
  paddingRight: true,
  paddingLeft: true,
  paddingTop: true,
  paddingBottom: true,
  value: true,
  width: true,
  height: true,
  target: true,
  type: true,
  href: true,
  src: true,
  name: true,
  htmlFor: true,
  checked: true,
  selected: true
};

/**
 * @renderedAsInnerMarkup: Only for documentation purposes. All of the
 * attributes that didn't make the cut to belong in renderSimple - with some
 * indication as to why they didn't.
 */
var renderedAsInnerMarkup = {
  content: true,
  dangerouslySetInnerHtml: true
};
var renderedAsStyleString = {
  style: true
};
var renderedAsClassSpecialCasedName = {
  className: true
};
var renderedAsClassSpecialCasedNameAndProcessing = {
  classSet: true
};



/**
 * @extractAndSealPosInfo: Should make a version for when we know the values are
 * numeric.
 */
var extractAndSealPosInfo = exports.extractAndSealPosInfo = function(obj) {
  if(!obj) { return ''; }
  var ret = ';', w = obj.w, h = obj.h, l = obj.l,
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

var _makeExtractAndSealerUsingVendorTransform =
    function(prefix, suffixForString, suffixForNum, suffixForNothing) {

  /**
   * Optimized for css engines that support translations. An absolutely
   * positioned element with a (top, left, width, height) is equivalent to an
   * absolutely positioned element with (width, height, translate3d(left, top,
   * 0)). When a position info includes a right value, things are more
   * complicated.  t:1, l:1, w:20, h:20 => transform(1,1), w:20, h:20
   *
   * t:1, l:1, r:10, b:10 => transform(1,1), r: 10+1, b:10+1
   *
   * see: http://jsfiddle.net/3HzTC/1/
   *
   * We need to trick certain webkit implementations into kicking the
   * computations to the GPU by using a 3d transform even though this is only a
   * 2d operation.
   */
  return function(obj) {
    if(!obj) { return ''; }
    var ret = ';', w = obj.w, h = obj.h, l = obj.l,
        t = obj.t, b = obj.b, r = obj.r, z = obj.z;

    /**
     * I with we didn't have to do these checks. Oh well, in the event that
     * we're using css3 to position, the javascript isn't going to likely be our
     * bottleneck anyways. Going forward, we should use posInfo: to represent
     * absolutely positioned coords such that no boundary is 'auto'
     */
    if (l === 'auto' || r === 'auto' || b === 'auto' || t === 'auto') {
      return extractAndSealPosInfo(obj);
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
    /*
     * Updates if the browser supports transforms are so much faster than merely
     * absolute positioning.
     */
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
     * because the left and top values are going to act as translate. Can't help
     * you out with percentages, though.
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

var _extractAndSealPosInfoUsingTranslateWebkit =
    _makeExtractAndSealerUsingVendorTransform(webkitVendorPrefix,
        webkitvendorSuffixForString, webkitvendorSuffixForNum,
        webkitvendorSuffixForNothing);

var _extractAndSealPosInfoUsingTranslateMoz =
    _makeExtractAndSealerUsingVendorTransform(mozVendorPrefix,
        mozVendorSuffixForString, mozVendorSuffixForNum,
        mozVendorSuffixForNothing);

var _extractAndSealPosInfoUsingTranslateIe =
    _makeExtractAndSealerUsingVendorTransform(ieVendorPrefix,
        ieVendorSuffixForString, ieVendorSuffixForNum,
        ieVendorSuffixForNothing);

/**
 * Will not work with 'auto', should remove support for auto everywhere - This
 * utility is flexible enough to preserve autos when they're already there -
 * just don't include a delta for the field you want to keep default 'auto'
 * behavior.
 *
 * Note that if an element is relatively positioned with a left and right value,
 * this won't do what you want (similarly to transforms). We handle transforms
 * because we know that we need to work around a relatively positioned system,
 * whereas when using this function, we're not sure if the object at hand is
 * using absolute or relatively positioned. We default to absolute.
 *
 * Summary: if you have a parent with an abs child and a rel child, using this
 * function to offset the rel child with respect to the abs child's posInfo will
 * not act strangely when that posInfo has both a right and a left.  You need to
 * manually compensate for that situation (so pass in forRel=true) Correction:
 * When position: 'relative' is used, you cannot seem to compensate at all for
 * right, right has no effect, because the element will first be statically
 * positioned, then the top and left values only will be used to offset it. The
 * forRel may still be useful when doing 3d transforms on abs positioned
 * elements.
 *
 * Todo: Let the transform code use this.
 *
 * In deltas:
 *   omitted: No field in result.
 *   Included and delta value zero:
 *       If posInfo value is present, that value is copied over to the result.
 *       If posInfo value is not present, no value is copied to result.
 */
var _posOffset = exports.posOffset = function(posInfo, deltas, forRel) {
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
exports.posOffsetIfPosInfo = function(posInfo, deltas, forRel) {
  return posInfo ? _posOffset(posInfo, deltas, forRel) : posInfo;
};

/**
 * Before the initial render, call this function to ensure that we compute
 * position information in a way that performs best.
 */
var getBrowserPositionComputation =
exports.getBrowserPositionComputation =
function(useTransformPositioning) {
  return !useTransformPositioning ? extractAndSealPosInfo :
    FEnv.browserInfo.browser === 'Chrome' ||
    FEnv.browserInfo.browser === 'Safari' ?
      _extractAndSealPosInfoUsingTranslateWebkit :
    FEnv.browserInfo.browser === 'Firefox' ?
      _extractAndSealPosInfoUsingTranslateMoz :
    FEnv.browserInfo.browser === 'Explorer' &&
     (FEnv.browserInfo.version === '9.0' ||
     FEnv.browserInfo.version === '10.0') ?
      _extractAndSealPosInfoUsingTranslateIe : extractAndSealPosInfo;
};


/**
 * Turn lookups that we know will be tested, yet return falsey, into lookups
 * that will return false. It would be a good idea, to look at your most
 * commonly named children of dom attributes for a given project and prime this
 * lookup map with false values for it - do a benchmark to see if there is any
 * noticeable improvement in render/update time.
 */
if (SET_MISS_WARM_UP) {
  /*{insertSetMessWarmUpOptimizationsHere}*/
  allTagAttrsLookup.contained = false;
  allTagAttrsLookup.children = false;
  allTagAttrsLookup.child = false;
  allTagAttrsLookup.leftChild = false;
  allTagAttrsLookup.rightChild = false;
}

/**
 * A quick lookup to determine if a field in an FDom property is something
 * supported by the dom, as opposed to a child member.
 */
exports.allTagAttrsAndHandlerNames =
    FUtils.merge(allTagAttrsLookup,
      FUtils.objMap(FEvent.abstractHandlers, FUtils.truther));



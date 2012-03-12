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
var F = require('Fax');

function replaceAll(str, find, replace) {
  var mutated = str;
  while (mutated && mutated.indexOf(find) !== -1) {
    mutated = mutated.replace(find, replace);
  }
  return mutated;
}

/**
 * Cross browser gradients.
 */
var GRADIENT_STR =
  '{fallbackBgColor};' +
  'background:-moz-linear-gradient(top, {highRgba}, {lowRgba}); ' +
  'background:-webkit-gradient(linear, left top, left bottom, ' +
      'from({highRgba}), to({lowRgba}));' +
  'filter: progid:DXImageTransform.Microsoft.Gradient(GradientType=0,'+
      'StartColorStr="#{highHexDigits}", ' +
      'EndColorStr="#{lowHexDigits}")';

/**
 * Cross browser opacity stylings.
 */
var OPACITY_STR = '{decimal};' +
  '-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity={msOpacity})";' +
  'filter: alpha(opacity={msOpacity})';


var BACKGROUND_IMAGE_STR = "url('{url}');" +
  'background-repeat:no-repeat;' +
  'background-position:{t}px {l}px;' +
  'background-attachment: {attachment}';

var TRANSITION_ONE_VALUE = '' +
    'all {seconds} {motion};' +
    '-webkit-transition: {feature} {seconds} {motion};' +
    '-moz-transition: {feature} {seconds} {motion};' +
    '-transition: {feature} {seconds} {motion}';


/**
 * FUiStylers: A useful set of utility functions for generating css values.
 * Most of these opereate on {rgba} maps, but when generating a stylesheet using
 * the build system/styleExports, values for css attributes must be in string
 * form. To convert use the rgbaStr functions here.
 */
function convertToHex(x) {
  var CHAR_BANK = "0123456789ABCDEF";
  x = Math.floor(parseInt(x,10));
  if (isNaN(x)) { throw "Cannot convert non number to hex!"; }
  x = Math.max(0,Math.min(x,255));
  return CHAR_BANK.charAt((x-x%16)/16) +
        CHAR_BANK.charAt(x%16);
}
var convertRgbToHexFromMap = function(map) {
  return convertToHex(map.r)+convertToHex(map.g)+convertToHex(map.b);
};
var rgbaToFilterHexFromMap = function(map) {
  return convertToHex((map.a || 1)*255)+convertToHex(map.r)+
         convertToHex(map.g)+convertToHex(map.b);
};

function makeRgbaMap(r, g, b, a) {
  var ret = {
    r: r, g: g, b: b
  };
  if (a !== undefined) {
    ret.a = a;
  }
  return ret;
}

var stylers = module.exports = {

  /**
   * Since everything works with key minification compilers, you end up having
   * to make sure you take special precautions when specifying string keys.
   */
  hoverFocusKey: function (singleMemberKey) {
    return '.' + F.keyOf(singleMemberKey) + ':hover, ' +
           '.' + F.keyOf(singleMemberKey) + ':focus';
  },

  activeKey: function (singleMemberKey) {
    return '.' + F.keyOf(singleMemberKey) + ':active';
  },

  firstChildKey: function (singleMemberKey) {
    return '.' + F.keyOf(singleMemberKey) + ':first-child';
  },

  afterKey: function (singleMemberKey) {
    return '.' + F.keyOf(singleMemberKey) + '::after';
  },

  /**
   * Accepts rgba arguments and represents it in a standard map form that most
   * of the stylers functions require, in order to operate.
   */
  rgba: makeRgbaMap,

  rgb: makeRgbaMap,


  rgbaStr: function (rgbaMap) {
    return 'rgb' + (rgbaMap.a || rgbaMap.a === 0 ? 'a(' : '(') +
        Math.floor(rgbaMap.r) + ',' + Math.floor(rgbaMap.g) + ',' +
        Math.floor(rgbaMap.b) + (rgbaMap.a !== undefined ? ','+
        rgbaMap.a : '') + ')';
  },

  /**
   * Alters an rgba map evenly across each color demension by 'points'
   */
  rgbaDelta: function (rgbaMap, points) {
    return {
      r: Math.min(Math.max(rgbaMap.r + points, 0), 255),
      g: Math.min(Math.max(rgbaMap.g + points, 0), 255),
      b: Math.min(Math.max(rgbaMap.b + points, 0), 255),
      a: rgbaMap.a
    };
  },

  burnDelta: function (rgbaMap, points) {
    return stylers.rgbaDelta(rgbaMap, -1*points);
  },

  dodgeDelta: function (rgbaMap, points) {
    return stylers.rgbaDelta(rgbaMap, points);
  },

  
  toneItDown: function(rgbaMap, percentage) {
    var r = rgbaMap.r, g = rgbaMap.g, b = rgbaMap.b;
    var avg = this._rgbaAvg(rgbaMap);
    return {
      r: r - (r - avg)*percentage,
      g: g - (g - avg)*percentage,
      b: b - (b - avg)*percentage,
      a: rgbaMap.a
    };
  },

  _rgbaAvg: function(rgbaMap) {
    return (rgbaMap.r + rgbaMap.g + rgbaMap.b)/3;
  },

  /**
   * Increases brightness by percentage of current brightness. Helps lighten
   * without ever ruining saturation when color dimensions start clipping.
   * 1 => black.
   * .1 => 10% of the current average closer to white.
   */
  burnFactor: function (rgbaMap, rate) {
    return stylers.rgbaDelta(rgbaMap, -1*this._rgbaAvg(rgbaMap)*rate);
  },

  /**
   * Increases darkness by percentage of current darkness.  Helps lighten
   * without ever ruining saturation when color dimensions start clipping.
   * 1 => white.
   * .1 => 10% of the current average closer to black.
   */
  dodgeFactor: function (rgbaMap, rate) {
    return stylers.rgbaDelta(rgbaMap, (255-this._rgbaAvg(rgbaMap))*rate);
  },

  /**
   * Supported by IE8+. With this model, you can resize contents to fit snugly
   * within their parent elements, without worrying about borders and padding,
   * (just like setting top:0,bottom:0,right:0,left:0) simply by setting
   * width/height to be100%, but you can't do more interesting stretchy layouts
   * as easily (for example: left:0, right:10px), also this won't work IE <= 7.
   * At render time/update time we could analyze the position info and determine
   * if we could benefit from injecting box-sizing styles into the inline
   * styles.  It might be more performant to set box-sizing to border-box, and
   * width:100% than to set left:0, right:0.
   */
  boxSizingValue: function(val) {
    return val + ';-moz-box-sizing:' + val + ';-webkit-box-sizing:' + val;
  },

  /**
   * Packs cross browser values into a single 'value'. Use like:
   * style = {borderRadius: FDom.stylers.roundValue(2)}
   */
  roundValue: function(radiusParam) {
		var radiusPx = (radiusParam || 0) + 'px';
		return radiusPx + '; border-radius:' + radiusPx +
      '; -webkit-border-radius:' + radiusPx + '; -moz-border-radius:' + radiusPx;
	},

	roundObj: function(radiusParam) {
		var radius = radiusParam || 3;
		return {
			'border-radius': radius,
			'-webkit-border-radius': radius,
			'-moz-border-radius': radius
		};
	},
	
	roundTop: function(radiusParam) {
		var radius = (radiusParam || 3) + 'px';
		return {
			'border-radius-top-right': radius,
			'-webkit-border-top-right-radius': radius,
			'-moz-border-top-right-radius': radius,
			'border-radius-top-left': radius,
			'-webkit-border-top-left-radius': radius,
			'-moz-border-top-left-radius': radius
		};
	},
	
	roundBottom: function(radiusParam) {
		var radius = (radiusParam || 3) + 'px';
		return {
			'border-radius-bottom-right': radius,
			'-webkit-border-bottom-right-radius': radius,
			'-moz-border-bottom-right-radius': radius,
			'border-radius-bottom-left': radius,
			'-webkit-border-bottom-left-radius': radius,
			'-moz-border-bottom-left-radius': radius
		};
	},
	
	/**
   * http://css-tricks.com/5376-ie-background-rgb-bug/ The way we exports styles
   * and mixins won't allow two keys of 'background', so we sneak in an extra
   * key/value pair in the value itself. This won't work for udpating values
   * after they've been rendered.  Use like: style = {background:
   * FDom.stylers.backgroundColorValue(...)}.
   * #todoie: Ie 8- do not support rgba. A better fallback is to use a filtered
   * gradient with the same start and end color.
   */
	backgroundColorValue: function(rr, gg, bb, aa) {
    var accum = stylers.rgbaStr({r:rr, g:gg, b:bb});
    if (aa || aa === 0) {
      accum += '; background:' + stylers.rgbaStr({r: rr, g:gg, b:bb, a: aa});
    }
    return accum;
	},
	
  /**
   * #todoie (filter) Use like: style = {boxShadow: FDom.stylers.boxShadowValue(...)}
   * Good article on box-shadow, and how to simulate in IE8-.
   * http://dev.opera.com/articles/view/cross-browser-box-shadows/
   */
	boxShadowValueWithParams: function(a, b, c, re, gr, bl, al, inset) {
    var shadow = stylers._shadowSegment(a,b,c,re,gr,bl,al,inset);
    return stylers._crossBrowserBoxShadowValue(shadow);
	},

  _crossBrowserBoxShadowValue: function (shadowText) {
    return shadowText + ';' +
        'box-shadow:' + shadowText + ';' +
        '-moz-box-shadow:' + shadowText + ';'+
        '-webkit-box-shadow:'+ shadowText;
  },

  boxShadowValue: function (map) {
    /* Backwards compatibility here: */
    if (map && !map.r && map.r !== 0) {
      return stylers.boxShadowValueWithParams.apply(stylers, arguments);
    }
    return stylers.boxShadowValueWithParams(
        map.x, map.y, map.size,
        map.r, map.g, map.b, map.a, map.inset);
  },

  blackBoxShadowValue: function(xysa) {
    return stylers.boxShadowValue(F.merge({r:0, g:0, b:0}, xysa));
  },

  boxShadowValueOutsetInset: function (outsetMap, insetMap) {
    var outsetShadow= stylers._shadowSegment(
        outsetMap.x, outsetMap.y, outsetMap.size,
        outsetMap.r, outsetMap.g, outsetMap.b, outsetMap.a, false);
    var insetShadow= stylers._shadowSegment(
        insetMap.x, insetMap.y, insetMap.size,
        insetMap.r, insetMap.g, insetMap.b, insetMap.a, true);

    return stylers._crossBrowserBoxShadowValue(
        outsetShadow + ',' + insetShadow);
  },

  textShadowValueOutsetInset: function (outsetMap, insetMap) {
    var outsetShadow= stylers._shadowSegment(
        outsetMap.x, outsetMap.y, outsetMap.size,
        outsetMap.r, outsetMap.g, outsetMap.b, outsetMap.a, false);
    var insetShadow= stylers._shadowSegment(
        insetMap.x, insetMap.y, insetMap.size,
        insetMap.r, insetMap.g, insetMap.b, insetMap.a, false);

    return outsetShadow + ',' + insetShadow;

  },

  noShadowValue: function() {
    return stylers._crossBrowserBoxShadowValue('none');
  },

  textShadowValue: function (shadowMap) {
    return stylers._shadowSegment(
        shadowMap.x, shadowMap.y,
        shadowMap.size, shadowMap.r, shadowMap.g,
        shadowMap.b, shadowMap.a, shadowMap.inset);
  },

  _shadowSegment: function (x,y,s,re,gr,bl,al,inset) {
    return (inset ? 'inset ' : '') +
        x+'px '+y+'px '+s+ 'px ' +
        stylers.rgbaStr({ r: re, g:gr, b:bl, a:al });
  },

  /**
   * Gradient from bottom to top. Injects cross browser values.
   * Does not work in browsers that don't support one of the gradient strategies
   * (possibly ie6/7). Make sure the element that the gradient is being applied
   * to "hasLayout" (so set zoom:1 in some other css class or reset.)
   */
  bgGradientValueForArgs: function(lR,lG,lB,lA,hR,hG,hB,hA) {
    return stylers.bgGradientValue({
      r: lR, g: lG, b: lB, a: lA
    }, {
      r: hR, g: hG, b: hB, a: hA
    });
  },

  bgGradientValueDodge: function (lMap, deltaHigh) {
    return stylers.bgGradientValue(
      lMap, stylers.dodgeDelta(lMap, deltaHigh));
  },

  bgGradientValue: function(lMap, hMap) {
    var lowWithoutA = F.objExclusion(lMap, {a: true});
    var lowWithoutAString = stylers.rgbaStr(lowWithoutA);
    var lowString = stylers.rgbaStr(lMap);
    var highString = stylers.rgbaStr(hMap);
    return GRADIENT_STR.replace('{fallbackBgColor}', lowWithoutAString)
                      .replace('{highRgba}', stylers.rgbaStr(hMap))
                      .replace('{lowRgba}', stylers.rgbaStr(lMap))
                      .replace('{highRgba}', stylers.rgbaStr(hMap))
                      .replace('{lowRgba}', stylers.rgbaStr(lMap))
                      .replace('{lowHexDigits}', rgbaToFilterHexFromMap(lMap))
                      .replace('{highHexDigits}', rgbaToFilterHexFromMap(hMap));
  },

  borderValue: function(color) {
    return 'solid 1px ' +
        (color.r || color.r === 0 ? stylers.rgbaStr(color) : color);
  },

  /* See: http://www.quirksmode.org/css/opacity.html - the order of ie opacity
   * statements matter. */
  opacityValue: function(decimal) {
    return OPACITY_STR.replace('{decimal}', decimal)
        .replace('{msOpacity}', decimal*100)
        .replace('{msOpacity}', decimal*100);
  },

  imageBgValue: function(url, t, l, isFixed) {
    return BACKGROUND_IMAGE_STR.replace('{url}', url)
        .replace('{t}', t || 0)
        .replace('{l}', l || 0)
        .replace('{attachment}', isFixed ? 'fixed' : 'scroll');

  },

  transitionAllValue: function(seconds, motion) {
    return stylers.transitionOneValue('all', seconds, motion);
  },

  transitionOneValue: function(feature, seconds, motion) {
    var time = seconds + 's';
    return replaceAll(
      replaceAll(
        replaceAll(TRANSITION_ONE_VALUE, "{feature}", feature),
        "{seconds}",
        time
      ),
      "{motion}",
      motion || 'ease-in-out'
    );
  }
};

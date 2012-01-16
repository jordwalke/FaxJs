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
 * FaxUi/FaxUi.js - core dom module for the FaxJs ui system. Low level building
 * blocks for javascript applications.
 */
var F = require('Fax');
var _FaxUi = {};
var FaxUi = {};


/**
 * Native dom "tag" components. Properties that you inject into these projection
 * constructors correspond to actual dom properties, not abstract ones.
 */
FaxUi.Div = F.makeDomContainerComponent('div');
FaxUi.TextArea = F.makeDomContainerComponent('textarea');
FaxUi.Label = F.makeDomContainerComponent('label');
FaxUi.Ul = F.makeDomContainerComponent('ul');
FaxUi.P = F.makeDomContainerComponent('p');
FaxUi.Img = F.makeDomContainerComponent('img');
FaxUi.A = F.makeDomContainerComponent('a');
FaxUi.Li = F.makeDomContainerComponent('li');
FaxUi.H1 = F.makeDomContainerComponent('h1');
FaxUi.H2 = F.makeDomContainerComponent('h2');
FaxUi.H3 = F.makeDomContainerComponent('h3');
FaxUi.H4 = F.makeDomContainerComponent('h4');
FaxUi.Span = F.makeDomContainerComponent('span');
FaxUi.Input = F.makeDomContainerComponent('input');
FaxUi.Button = F.makeDomContainerComponent('button');
FaxUi.Table = F.makeDomContainerComponent('table');
FaxUi.Tr = F.makeDomContainerComponent('tr');
FaxUi.Th = F.makeDomContainerComponent('th');
FaxUi.Td = F.makeDomContainerComponent('td');
FaxUi.IFrame = F.makeDomContainerComponent('iframe');


/*
 * FaxUi.Ordered: A container of several same-typed subcomponents each element
 * in the properties passed in must all accept the same properties (in other
 * words implement the same interface.
 */
_FaxUi.OrderedConstructor = F.MakeComponentClass({},[F.orderedComponentMixins]);
FaxUi.Ordered = function(propsParam) {
  var props = propsParam || this;
  return {
    props: props,
    maker: _FaxUi.OrderedConstructor
  };
};


/*
 * FaxUi.MultiDynamic: A container of several same-typed subcomponents each
 * element in the properties passed in must all accept the same properties (in
 * other words implement the same interface.
 */
_FaxUi.MultiDynamicConstructor =
    F.MakeComponentClass({},[F.multiDynamicComponentMixins]);
FaxUi.MultiDynamic = function(propsParam) {
  var props = propsParam || this;
  return {
    props: props,
    maker: _FaxUi.MultiDynamicConstructor
  };
};


module.exports = F.ComponentizeAll(FaxUi);
var nonSelectableMixin = {
  '-moz-user-select': '-moz-none',
  '-webkit-user-select': 'none',
  '-khtml-user-select': 'none',
  'user-select': 'none'
};
module.exports.styleExports = {
	hdn: { display: 'none' },
	ib: { display: 'inline-block' },
	abs: { margin: 0, position: 'absolute' },
	relZero: { position: 'relative', left:0, right:0 },
	vStretch: { position: 'absolute', top: 0, bottom: 0 },
	hStretch:  { position: 'absolute', left:0, right:0 },
  hVStretch: { display: 'block', padding: 0, margin: 0,
               position: 'absolute', top: 0, bottom: 0, left:0, right:0},
  block: {
    display: 'block'
  },
	nover: {
		'-ms-overflow-x': 'hidden',
		'-ms-overflow-y': 'hidden',
		overflow: 'hidden'
	},
	over: {
		'-ms-overflow-x': 'visible',
		'-ms-overflow-y': 'visible',
		overflow: 'visible'
	},
	cursorPointer: { cursor: 'pointer' },
	cursorDefault: { cursor: 'default' },
	cursorColResize: { cursor: 'col-resize' },
	cursorRowResize: { cursor: 'row-resize' },
	
	/**
   * http://help.dottoro.com/lcrlukea.php #todoIe: unselectable="on" is tag attr
   * #todoie: Inject that into the tags by default for FView base.
	 */
	noSelect: nonSelectableMixin,

  material: F.merge(nonSelectableMixin),

  '.noSelect::selection': {
    'background-color': 'transparent'
  }
};

/**
 * FaxUi.stylers contains two types of styling functions. On generates style
 * objects that may be used as mixins with other style objects, and the other
 * type of functions generate values. Often we pack multiple key/values into a
 * single value by injecting it, but that ruins runtime changability for any
 * high level attribute value such as backgroundColorValue we'd need to write
 * custom runtime controls. But in the future we will just have custom builds
 * anyways for each target, and in that case there should be at most one key for
 * each value.
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
  return convertToHex(map.a*255)+convertToHex(map.r)+
         convertToHex(map.g)+convertToHex(map.b);
};

var stylers = module.exports.stylers = {

  /**
   * Since FaxJs works with key minification compilers, you end up having to
   * make sure you take special precautions when specifying string keys.
   */
  hoverFocusKey: function (singleMemberKey) {
    return '.' + F.keyOf(singleMemberKey) + ':hover, ' +
           '.' + F.keyOf(singleMemberKey) + ':focus';
  },

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

  /**
   * Alters an rgba map evenly across each color demension by a rate.
   */
  rgbaFactor: function (rgbaMap, rate) {
    return stylers.rgbaDelta(rgbaMap, 255*rate);
  },

  burnFactor: function (rgbaMap, rate) {
    return stylers.rgbaFactor(rgbaMap, -1*rate);
  },

  dodgeFactor: function (rgbaMap, rate) {
    return stylers.rgbaFactor(rgbaMap, rate);
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
    return val + ';box-sizing:' + val +
            ';-moz-box-sizing:' + val + ';-webkit-box-sizing:' + val;
  },

  /**
   * Packs cross browser values into a single 'value'. Use like:
   * style = {borderRadius: FaxUi.stylers.roundValue(2)}
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
		var radius = radiusParam || 3;
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
		var radius = radiusParam || 3;
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
   * FaxUi.backgroundColorValue(...)}.
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
   * Gradient from bottom to top. Injects cross browser *keys* and values.
   * #todoie (filter) Use like: style = {boxShadow: FaxUi.boxShadowValue(...)}
   * Good article on box-shadow, and how to simulate in IE8-.
   * http://dev.opera.com/articles/view/cross-browser-box-shadows/
   */
	boxShadowValueWithParams: function(a, b, c, re, gr, bl, al, inset) {
    var shadow = stylers._shadowSegment(a,b,c,re,gr,bl,al,inset);
    return stylers._crossBrowserBoxShadow(shadow);
	},

  _crossBrowserBoxShadow: function (shadowText) {
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

  boxShadowOutsetAndInset: function (outsetMap, insetMap) {
    var outsetShadow= stylers._shadowSegment(
        outsetMap.x, outsetMap.y, outsetMap.size,
        outsetMap.r, outsetMap.g, outsetMap.b, outsetMap.a, false);
    var insetShadow= stylers._shadowSegment(
        insetMap.x, insetMap.y, insetMap.size,
        insetMap.r, insetMap.g, insetMap.b, insetMap.a, true);

    return stylers._crossBrowserBoxShadow(outsetShadow + ',' + insetShadow);

  },

  textShadowOutsetAndInset: function (outsetMap, insetMap) {
    var outsetShadow= stylers._shadowSegment(
        outsetMap.x, outsetMap.y, outsetMap.size,
        outsetMap.r, outsetMap.g, outsetMap.b, outsetMap.a, false);
    var insetShadow= stylers._shadowSegment(
        insetMap.x, insetMap.y, insetMap.size,
        insetMap.r, insetMap.g, insetMap.b, insetMap.a, false);

    return outsetShadow + ',' + insetShadow;

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
   * Gradient from bottom to top. Injects cross browser values. #todoie (filter)
   * Use like: style = {background: FaxUi.backgroundBottomUpGradientValue(...)}
   * Since we don't set a fallback color, this won't work in browsers that don't
   * support one of the following gradient settings. (Maybe ie6?)
   */
  backgroundBottomUpGradientValueParams: function(lR,lG,lB,lA,hR,hG,hB,hA) {
    return stylers.backgroundBottomUpGradientValue({
      r: lR, g: lG, b: lB, a: lA
    }, {
      r: hR, g: hG, b: hB, a: hA
    });
  },

  backgroundGradientDodgeValue: function (lMap, deltaHigh) {
    return stylers.backgroundBottomUpGradientValue(
      lMap, stylers.dodgeDelta(lMap, deltaHigh));
  },

  backgroundBottomUpGradientValue: function(lMap, hMap) {
    var lowWithoutA = F.objExclusion(lMap, {a: true});
    var lowWithoutAString = stylers.rgbaStr(lowWithoutA);
    var lowString = stylers.rgbaStr(lMap);
    var highString = stylers.rgbaStr(hMap);
    return lowWithoutAString +
    '; background:-moz-linear-gradient(top, ' + stylers.rgbaStr(hMap) +
    ',' + stylers.rgbaStr(lMap) + '); background:-webkit-gradient(' +
    'linear, left top, left bottom, from(' + stylers.rgbaStr(hMap) + 
    '), to(' + stylers.rgbaStr(lMap) + 
    ')); filter: progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr="#' +
    rgbaToFilterHexFromMap(hMap) + '", EndColorStr="#' + rgbaToFilterHexFromMap(lMap)+'")';
  },

  borderValue: function(color) {
    return 'solid 1px ' +
        (color.r || color.r === 0 ? stylers.rgbaStr(color) : color);
  },

  /* See: http://www.quirksmode.org/css/opacity.html - the order of ie opacity
   * statements matter. */
  opacityValue: function(decimal) {
    var msOpacity = '' + decimal*100;
    return decimal +
        '; -ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=' +
        msOpacity + ')";' +
        'filter: alpha(opacity=' + msOpacity + ')';
  }
};


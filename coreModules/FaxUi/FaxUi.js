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
 x = parseInt(x,10);
 if (isNaN(x)) { throw "Cannot convert non number to hex!"; }
 x = Math.max(0,Math.min(x,255));
 return CHAR_BANK.charAt((x-x%16)/16) +
        CHAR_BANK.charAt(x%16);
}
var convertRgbToHex = function(R,G,B) {
  return convertToHex(R)+convertToHex(G)+convertToHex(B);
};
var rgbaToFilterHex = function(R,G,B,A) {
  return convertToHex(A*255)+convertToHex(R)+convertToHex(G)+convertToHex(B);
};

module.exports.stylers = {
  /**
   * Supported by IE8+. With this model, you can resize contents to fit snugly
   * within their parent elements, without worrying about borders and padding,
   * (just like setting top:0,bottom:0,right:0,left:0) simply by setting
   * width/height to be100%, but you can't do more interesting stretchy layouts
   * as easily (for example: left:0, right:10px), also this won't work IE <= 7.
   */
  boxSizingValue: function(val) {
    return val + '; -moz-box-sizing:' + val + '; -webkit-box-sizing:' + val;
  },
  /**
   * Packs cross browser values into a single 'value'. Use like:
   * style = {borderRadius: FaxUi.stylers.roundValue(2)}
   */
  roundValue: function(radiusParam) {
		var radiusPx = (radiusParam || 3) + 'px';
		return radiusPx + '; -webkit-border-radius:' + radiusPx +
			'; -moz-border-radius:' + radiusPx;
	},
	round: function(radiusParam) {
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
   * FaxUi.backgroundColorValue(...)}
	 */
	backgroundColorValue: function(rr, gg, bb, aa) {
		var r = rr || 0, g = gg || 0, b = bb || 0, a = aa || 0;
		return 'rgb('+r+','+g+','+b+'); background:rgba('+r+','+g+','+b+','+a+')';
	},
	
  /**
   * Gradient from bottom to top. Injects cross browser *keys* and values.
   * #todoie (filter) Use like: style = {boxShadow: FaxUi.boxShadowValue(...)}
   */
	boxShadowValue: function(a, b, c, d, e, f, al) {
    return a+'px '+b+'px '+c+'px rgba('+d+','+e+','+f+','+al+');' +
    '-moz-box-shadow:'+a+'px '+b+'px '+c+
      'px rgba('+d+','+e+','+f+','+al+');'+
    '-webkit-box-shadow:'+a+'px '+b+'px '+c+
      'px rgba('+d+','+e+','+f+','+al+')';
	},

  /**
   * Gradient from bottom to top. Injects cross browser values. #todoie (filter)
   * Use like: style = {background: FaxUi.backgroundBottomUpGradientValue(...)}
   * Since we don't set a fallback color, this won't work in browsers that don't
   * support one of the following gradient settings. (Maybe ie6?)
   */
  backgroundBottomUpGradientValue: function (lR, lG, lB, lA, hR, hG, hB, hA) {
    return 'rgb(' + lR + ',' + lG + ',' + lB +
    '); background:-moz-linear-gradient(top, rgba(' + hR+','+hG+','+hB+','+hA+
    '), rgba('+lR+','+lG+','+lB+','+lA+')); background:-webkit-gradient(' +
    'linear, left top, left bottom, from(rgba('+hR+','+hG+','+hB+','+hA+
    ')), to(rgba('+lR+','+lG+','+lB+','+lA+
    '))); filter: progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr="#' +
    rgbaToFilterHex(hR,hG,hB,hA) + '", EndColorStr="#' + rgbaToFilterHex(lR,lG,lB,lA)+'")';
  },
  backgroundBottomUpGradientValueFromMaps: function(lowMap, highMap) {
    return module.exports.stylers.backgroundBottomUpGradientValue(
        lowMap.r, lowMap.g, lowMap.b, lowMap.a,
        highMap.r, highMap.g, highMap.b, highMap.a);
  },
  borderValue: function(color) {
    return 'solid 1px ' + color;
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


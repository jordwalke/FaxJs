/**
 * FaxUi - Core Fax Ui components - low level constructs for building higher
 * level components.
 */
var F = require('Fax');
var _FaxUi = {};
var FaxUi = {};
F.using(FaxUi);


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

/**
 * FaxUi.MakeTagView: Makes slightly higher level view components from lower
 * level dom constructors. Giving a nice positioning, and mixin (overrides) api
 * that is more consistent and flexible than the native DOM api. Build your
 * applications on top of these components for better cross browser/platform
 * compatibility, but experience a slight performance hit. Eventually each tag
 * view can be implemented specifically for performance, while not needing to
 * change any users of tag views.
 */
FaxUi.MakeTagView = function(NativeTagProjectingConstructor) {
  return {
    project : function() {
      var props = this.props;
      var nativeTagProps;
      var overrides = props.overrides || {};
      var tagClssSet = {tagClss:'abs nover hVStretch block ' };
      if (props.clssSet || overrides.clssSet) {
        tagClssSet = F.mergeThree(
            tagClssSet,
            props.clssSet,
            overrides.clssSet);
      }
      /**
       * Style as specified by the discouraged style property, then override with
       * positioning info, then override with any 'override' positioning
       * attributes.
       */
      var nativeTagStyle = F.mergeThree(
          props.style,
          F.extractAndSealPosInfo(props),
          F.extractAndSealPosInfo(overrides));

      nativeTagProps = F.mergeThree(props, overrides, {
        clss: F.clssSet(tagClssSet),
        style: nativeTagStyle
      });

      delete nativeTagProps.overrides;
      delete nativeTagProps.clssSet;
      // Could also delete position info
      return NativeTagProjectingConstructor(nativeTagProps);
    }
  };
};


FaxUi.ViewDiv = FaxUi.MakeTagView(FaxUi.Div);
FaxUi.ViewA = FaxUi.MakeTagView(FaxUi.A);
FaxUi.ViewLabel = FaxUi.MakeTagView(FaxUi.Label);
FaxUi.ViewUl = FaxUi.MakeTagView(FaxUi.Ul);
FaxUi.ViewP = FaxUi.MakeTagView(FaxUi.P);
FaxUi.ViewImg = FaxUi.MakeTagView(FaxUi.Img);
FaxUi.ViewLi = FaxUi.MakeTagView(FaxUi.Li);
FaxUi.ViewH1 = FaxUi.MakeTagView(FaxUi.H1);
FaxUi.ViewH2 = FaxUi.MakeTagView(FaxUi.H2);
FaxUi.ViewH3 = FaxUi.MakeTagView(FaxUi.H3);
FaxUi.ViewH4 = FaxUi.MakeTagView(FaxUi.H4);
FaxUi.ViewSpan = FaxUi.MakeTagView(FaxUi.Span);
FaxUi.ViewInput = FaxUi.MakeTagView(FaxUi.Input);
FaxUi.ViewButton = FaxUi.MakeTagView(FaxUi.Button);
FaxUi.ViewTable = FaxUi.MakeTagView(FaxUi.Table);
FaxUi.ViewTr = FaxUi.MakeTagView(FaxUi.Tr);
FaxUi.ViewTd = FaxUi.MakeTagView(FaxUi.Td);

/*
 * Those should be avoided when possible. Building entirely on top of an FView
 * will ensure that various targets are well supported. In the reference
 * implementation for web browsers, not desktop software, a div is used.
 */
FaxUi.FView = FaxUi.ViewDiv;


/**
 * FaxUi.MultiConstructor: A container of several named subcomponents each
 * potentially having an entirely different 'type'. Each name must always refer
 * to an instance of that particular type. The members must not ever change
 * order and must never grow or shrink.
 */
_FaxUi.MultiConstructor = F.MakeComponentClass({},[F.multiComponentMixins]);
FaxUi.Multi = function(propsParam) {
  var props = propsParam || this;
  return {
    props: props,
    maker: _FaxUi.MultiConstructor
  };
};



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
module.exports.styleExports = {
	hdn: { display: 'none' },
	ib: { display: 'inline-block' },
	abs: { margin: 0, position: 'absolute' },
	relZero: { position: 'relative', left:0, right:0 },
	vStretch: { position: 'absolute', top: 0, bottom: 0 },
	hStretch:  { position: 'absolute', left:0, right:0 },
  hVStretch: { display: 'block', padding: 0, margin: 0,
               position: 'absolute', top: 0, bottom: 0, left:0, right:0},
  bottomFooter10: {position: 'absolute', left: 10, bottom: 10, right: 10},
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
	pointer: { cursor: 'pointer' },
	
	/**
   * http://help.dottoro.com/lcrlukea.php #todoIe: unselectable="on" is tag attr
   * #todoie: Inject that into the tags by default for FView base.
	 */
	noSelect: {
		'-moz-user-select': '-moz-none',
		'-webkit-user-select': 'none',
    '-khtml-user-select': 'none',
    'user-select': 'none'
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


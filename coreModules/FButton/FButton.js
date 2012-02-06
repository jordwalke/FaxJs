var F = require('Fax'),
    FaxUi = require('FaxUi'),
    stylers = FaxUi.stylers,
    T = require('FTheme'),
    FButton = {};

F.using(FaxUi);

/*
 * Key mirror makes the values match the keys. This is convenient so other
 * elements can use these types as classes themselves without having to
 * instantiate an FButton. F.keyMirror acts in a way so as not to break advanced
 * minification mode (renaming object keys).
 */
var Types = F.keyMirror({
  FButtonOkay: 1,
  FButtonDanger: 1,
  FButtonNormal: 1,
  FButtonNormalContrasted: 1
});

/* FButton component:
 *    type: See Types
 *    labelText: The label text,
 *    href: a link href
 */
FButton.FButton = {
  project: function() {
    var P = this.props, type = P.type || Types.FButtonNormal;
    return (P.anchorWithHref ? FaxUi.A : FaxUi.Button)(F.merge(P, {
      classSet: {
        FButton: true,
        FButtonOkay: type === Types.FButtonOkay,
        FButtonDanger: type === Types.FButtonDanger,
        FButtonNormal: type === Types.FButtonNormal,
        FButtonNormalContrasted: type === Types.FButtonNormalContrasted,
        classSet: this.props.classSet
      },
      content: this.props.labelText,
      href: this.props.anchorWithHref
    }));
  }
};

  
module.exports = FButton = F.ComponentizeAll(FButton);
module.exports.Types = Types;

module.exports.styleExports = {
  FButton: F.merge(FaxUi.styleExports.noSelect, {
    borderRadius: stylers.roundValue(T.interfaceElementsRadius),
    boxSizing: stylers.boxSizingValue('border-box'),
    fontSize: T.interfaceElementsControlFontSize,
    height: T.interfaceControlsTotalHeight,
    lineHeight: T.interfaceControlsTotalHeight,
    padding: '0px 8px',
    'text-align': 'center',
    outline: 0,
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
    cursor: 'pointer',
    '-webkit-transition': 'all .14s linear',
    '-moz-transition': 'all .14s linear',
    'vertical-align': 'baseline'
  }),
  FButtonOkay: {
    border: stylers.borderValue(T.contrast(T.okayBgColor, T.okayBorderDiff)),
    backgroundColor: stylers.rgbaStr(T.okayBgColor),
    color: stylers.rgbaStr(T.okayTextColor)
  },
  FButtonDanger: {
    border: stylers.borderValue(T.contrast(T.dangerBgColor, T.dangerBorderDiff)),
    backgroundColor: stylers.rgbaStr(T.dangerBgColor),
    color: stylers.rgbaStr(T.dangerTextColor)
  },
  FButtonNormal: {
    border: stylers.borderValue(T.contrast(T.normalBgColor, T.normalBorderDiff)),
    backgroundColor: stylers.rgbaStr(T.normalBgColor),
    color: stylers.rgbaStr(T.normalTextColor)
  },

  /** When a light color scheme has a button that's a bit darker, but shown on a
   * darker background (a really mild background), we may need to make the
   * button *even* darker than it normally is. Use what looks best for your use
   * case. */
  FButtonNormalContrasted: {
    border: stylers.borderValue(
      T.intensify(T.normalContrastedBgColor, T.normalContrastedBorderDiff)
    ),
    backgroundColor: stylers.rgbaStr(T.normalContrastedBgColor),
    color: stylers.rgbaStr(T.normalContrastedTextColor)
  }
};

var styleExports = module.exports.styleExports;

var okayBgColorHovered = T.contrast(T.okayBgColor, 15);
var dangerBgColorHovered = T.contrast(T.dangerBgColor, 15);
var normalBgColorHovered = T.contrast(T.normalBgColor, 10);
var normalContrastedBgColorHovered = T.intensify(T.normalContrastedBgColor, 10);


styleExports[stylers.hoverFocusKey({FButton: true})] = {
  outline: 0,
  textDecoration: 'none'
};
styleExports[stylers.hoverFocusKey({FButtonOkay: true})] = {
  border: stylers.borderValue(T.contrast(okayBgColorHovered, 2*T.okayBorderDiff)),
  backgroundColor: stylers.rgbaStr(okayBgColorHovered),
  boxShadow: stylers.boxShadowValue(F.merge(T.fullInvertColor, {x:0,y:1,size:2, a:0.2})),
  color: stylers.rgbaStr(T.okayTextColor)
};

styleExports[stylers.hoverFocusKey({FButtonDanger: true})] = {
  border: stylers.borderValue(T.contrast(dangerBgColorHovered, 2*T.dangerBorderDiff)),
  backgroundColor: stylers.rgbaStr(dangerBgColorHovered),
  color: stylers.rgbaStr(T.dangerTextColor)
};

styleExports[stylers.hoverFocusKey({FButtonNormal: true})] = {
  border: stylers.borderValue(T.contrast(normalBgColorHovered, 2*T.normalBorderDiff)),
  backgroundColor: stylers.rgbaStr(normalBgColorHovered),
  boxShadow: stylers.boxShadowValue(F.merge(T.fullInvertColor, {x:0,y:1,size:2, a:0.04})),
  color: stylers.rgbaStr(T.normalTextColor)
};

styleExports[stylers.hoverFocusKey({FButtonNormalContrasted: true})] = {
  border: stylers.borderValue(T.intensify(normalContrastedBgColorHovered, 2*T.normalContrastedBorderDiff)),
  backgroundColor: stylers.rgbaStr(normalContrastedBgColorHovered),
  boxShadow: stylers.boxShadowValue(F.merge(T.fullInvertColor, {x:0,y:1,size:2, a:0.04})),
  color: stylers.rgbaStr(T.normalTextColor)
};

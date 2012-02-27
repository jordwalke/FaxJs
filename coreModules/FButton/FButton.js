var F = require('Fax'),
    FDom = require('FDom'),
    stylers = FDom.stylers,
    T = require('FTheme'),
    FButtonModule = {};

F.using(FDom);

var Types = FButtonModule.Types = F.keyMirror({
  FButtonConfirm: 1,
  FButtonOkay: 1
});

FButtonModule.FButton = {
  structure: function() {
    var P = this.props, type = P.type || Types.FButtonOkay;
    return (P.anchorWithHref ? FDom.A : FDom.Button)(F.merge(P, {
      classSet: {
        FButton: true,
        FButtonConfirm: type === Types.FButtonConfirm,
        FButtonOkay: type === Types.FButtonOkay,
        classSet: this.props.classSet
      },
      content: this.props.labelText,
      href: this.props.anchorWithHref
    }));
  }
};

module.exports = FButtonModule = F.ComponentizeAll(FButtonModule);

var styleExports = module.exports.styleExports = {
  FButton: {
    boxSizing: stylers.boxSizingValue('border-box'),
    borderRadius: stylers.roundValue(T.controlsRadius),
    fontSize: T.controlsFontSize,
    height: T.controlsHeight,
    lineHeight: T.controlsHeight,
    padding: '0px 8px',
    'text-align': 'center',
    outline: 0,
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
    cursor: 'pointer',
    'vertical-align': 'middle',
    transition: stylers.transitionAllValue(0.10)
  },

  FButtonOkay: {
    border: stylers.borderValue(T.okayBorderColor),
    borderBottom: stylers.borderValue(T.okayBorderBottomColor),
    backgroundColor: stylers.rgbaStr(T.okayBgColor),
    color: stylers.rgbaStr(T.okayTextColor),
    boxShadow: stylers.blackBoxShadowValue(T.okayShadowSpec)
  },

  FButtonConfirm: {
    border: stylers.borderValue(T.confirmBorderColor),
    borderBottom: stylers.borderValue(T.confirmBorderBottomColor),
    backgroundColor: stylers.rgbaStr(T.confirmBgColor),
    color: stylers.rgbaStr(T.confirmTextColor),
    boxShadow: stylers.blackBoxShadowValue(T.confirmShadowSpec)
  }
};

styleExports[stylers.hoverFocusKey({FButton: true})] = {
  outline: 0,
  textDecoration: 'none'
};

/**
 * Hover and focus style.
 */
styleExports[stylers.hoverFocusKey({FButtonOkay: true})] = {
  border: stylers.borderValue(T.okayBorderColorHovered),
  borderBottom: stylers.borderValue(T.okayBorderBottomColorHovered),
  backgroundColor: stylers.rgbaStr(T.okayBgColorHovered),
  color: stylers.rgbaStr(T.okayTextColor),
  boxShadow: stylers.blackBoxShadowValue(T.okayShadowSpecHovered)
};

/**
 * Active style.
 */
styleExports[stylers.activeKey({FButtonOkay: true})] = {
  border: stylers.borderValue(T.okayBorderColorActive),
  borderBottom: stylers.borderValue(T.okayBorderBottomColorActive),
  backgroundColor: stylers.rgbaStr(T.okayBgColorActive),
  color: stylers.rgbaStr(T.okayTextColor),
  boxShadow: stylers.blackBoxShadowValue(T.okayShadowSpecActive)
};

/**
 * Hover and focus style.
 */
styleExports[stylers.hoverFocusKey({FButtonConfirm: true})] = {
  border: stylers.borderValue(T.confirmBorderColorHovered),
  borderBottom: stylers.borderValue(T.confirmBorderBottomColorHovered),
  backgroundColor: stylers.rgbaStr(T.confirmBgColorHovered),
  color: stylers.rgbaStr(T.confirmTextColor),
  boxShadow: stylers.blackBoxShadowValue(T.confirmShadowSpecHovered)
};

/**
 * Active style.
 */
styleExports[stylers.activeKey({FButtonConfirm: true})] = {
  border: stylers.borderValue(T.confirmBorderColorActive),
  borderBottom: stylers.borderValue(T.confirmBorderBottomColorActive),
  backgroundColor: stylers.rgbaStr(T.confirmBgColorActive),
  color: stylers.rgbaStr(T.confirmTextColor),
  boxShadow: stylers.blackBoxShadowValue(T.confirmShadowSpecActive)
};




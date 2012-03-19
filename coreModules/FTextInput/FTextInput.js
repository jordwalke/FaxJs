/**
 * FTextInput: Lightweight wrappers around native dom elements, providing
 * appropriate interfaces for them.
 */
var F = require('Fax'),
    FDom = require('FDom'),
    stylers = FDom.stylers,
    FTheme = require('FTheme'),
    Input = FDom.Input,
    Div = FDom.Div,
    FTextInput = {};

var Consts =  {
  textInputHorzPadding: 5
};

/**
 * Todo: Add to utils.
 */
function invokeWith(f, param) {
  if (f) {
    f(param);
  }
}

/*
 * As long as no mutation occurs on this, it's more memory efficient to refer to
 * a single object. We should seal this object so it will alarm us of attempts
 * to modify it in modern browsers.
 */
var WRAPPER_CLASS_SET = {
  FTextInputWrapper: true
};

var INPUT_CLASS_SET = {
  FTextInput: true
};

var INPUT_PLACEHELD_CLASS_SET = {
  FTextInput: true,
  FTextInputPlaceheld: true
};


/**
 * This text input element provides several conveniences for using a text input,
 * which is traditionally used in a bidirectional manner (with respect to data
 * bindings). It provides an idempotent interface and lets the container know of
 * text changes by way of event handlers.
 *
 * It also fixes positioning difficulties (absolute) so that you can use posInfo
 * as you normally would on any other block element. It does so using the well
 * known position relative-100%-inside-an-absolutely-positioned-div trick.
 *
 * Todo: Fix the annoying chrome bug by toggling an imaginary class.
 *    Only occurs in chrome when using browser optimized positioning (css3
 *    transforms)
 * http://stackoverflow.com/questions/7347241/
 *    caret-text-cursor-stops-when-translate3d-is-applied
 *
 * I believe that in all uses, every ui control should be 'externally' owned
 * - someone, somewhere outside of this component should hold the truth, and be
 *   streaming that truth into this component. However, that doesn't demo so
 *   well (best practices hardly ever do), so we'll support the non-externally
 *   owned case.
 */
FTextInput.FTextInput = {
  initState: function(initProps) {
    return {
      focused: false,
      lastBlurredValue: '' // Just for internally owned case.
    };
  },

  /* Todo: We need: OnTabAttempt, OnTextChangeAttempt, OnTabHappened
   * onEnterHappened.  OnEnterDown causing textbox change, should not trigger a
   * textChange on the mouseup.  */
  onKeyDown: function(e) {
    var nativeEvent = e.nativeEvent, keyCode = nativeEvent.keyCode;
    invokeWith(keyCode === 9 &&
        nativeEvent.shiftKey && this.props.onBackTabAttempt, e);
    invokeWith(keyCode === 9 &&
        !nativeEvent.shiftKey && this.props.onTabAttempt, e);
    invokeWith(keyCode === 38 && this.props.onUpArrowAttempt, e);
    invokeWith(keyCode === 40 && this.props.onDownArrowAttempt, e);
    invokeWith(this.props.onKeyDown, e);
  },

  /* In some browsers (*cough-Firefox-cough*) the key up event is triggered on a
   * textbox even if tabbing out of the box and the box will blur. What's worse
   * is that it depends on how fast you press and hold tab. This doesn't seem
   * right. We could also fix this at the core top level event delegation layer,
   * but we'll fix it here first.  */
  onKeyUp: function(e) {
    var nativeEvent = e.nativeEvent, keyCode = nativeEvent.keyCode;
    var val = e.target.value;
    if (this.props.value !== val && this.state.focused) {
      this.justUpdateState({ userText: val });
      invokeWith(this.props.onTextChange, val);
    }
    invokeWith(nativeEvent.keyCode === 13 && this.props.onEnter, e);
    invokeWith(this.props.onKeyUp, e);
  },

  onBlur: function(e) {
    invokeWith(this.props.onBlurValue, e.target.value);
    invokeWith(this.props.onBlur, e);

    return {
      focused: false,
      lastBlurredValue: e.target.value
    };
  },

  onFocus: function (e) {
    invokeWith(this.props.onFocusValue, e.target.value);
    invokeWith(this.props.onFocus, e);
    return { focused: true };
  },

  structure: function() {
    var P = this.props,
        S = this.state,
        extern = F.keyOf({value:1}) in P;
    var intendedText = extern ? P.value : S.lastBlurredValue;
    var placeHeld = !intendedText && !S.focused;
    var textToShow = placeHeld && P.placeholder ? P.placeholder :
        intendedText ? intendedText : '';

    /* http://stackoverflow.com/questions/4577344/
     *        getting-firefox-to-stretch-an-input-properly */
    return Div({
      classSet: [
        WRAPPER_CLASS_SET,
        P.wrapperClassSet
      ],
      posInfo: P.posInfo,
      actualInput: Input({
        classSet: [
          placeHeld ? INPUT_PLACEHELD_CLASS_SET : INPUT_CLASS_SET,
          P.inputClassSet
        ],
        tabIndex: P.tabIndex,
        type: 'text',
        value: textToShow,
        onKeyDown: this.onKeyDown.bind(this),
        onKeyUp: this.onKeyUp.bind(this),
        onBlur: this.stateUpdater(this.onBlur),
        onFocus: this.stateUpdater(this.onFocus),
        onClick: this.props.onClick
      })
    });
  }
};

module.exports = F.ComponentizeAll(FTextInput);
module.exports.Consts = Consts;

module.exports.styleExports = {
  FTextInputWrapper: {
    height: FTheme.controlsHeight,
    boxSizing: stylers.boxSizingValue('border-box'),
    display: 'inline-block'
  },

  FTextInput: {
    position: 'relative',
    width: '100%',
    height: '100%',
    'outline-style': 'none',
    boxSizing: stylers.boxSizingValue('border-box'), // Should add to all buttons/selects
    lineHeight: (FTheme.textInputFontSize),
    margin: 0,
    display: 'inline-block',
    paddingLeft: Consts.textInputHorzPadding,
    paddingRight: Consts.textInputHorzPadding,
    border: stylers.borderValue(FTheme.textInputBorderColor),
    borderRadius: stylers.roundValue(FTheme.controlsRadius),
    color: stylers.rgbaStr(FTheme.textInputTextColor),
    fontWeight: 'normal',
    fontSize: FTheme.textInputFontSize,
    transition: stylers.transitionOneValue('box-shadow', 0.25),
    boxShadow: stylers.noShadowValue()
  },

  FTextInputPlaceheld: {
    color: stylers.rgbaStr(FTheme.textInputTextColorPlaceheld)
  }
};

/**
 * Will fix bootstrap.
 */
module.exports.styleExports['input:focus, textarea:focus'] = {
  borderColor: stylers.rgbaStr(FTheme.textInputBorderColorFocus),
  boxShadow: stylers.boxShadowValue(FTheme.textInputFocusOutsetShadowSpec),
  borderRadius: FTheme.controlsRadius
};



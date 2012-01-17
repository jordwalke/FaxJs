/**
 * FTextInput: Lightweight wrappers around native dom elements, providing
 * appropriate interfaces for them.
 */
var F = require('Fax'),
    FaxUi = require('FaxUi'),
    stylers = FaxUi.stylers,
    FTheme = require('FTheme'),
    Input = FaxUi.Input,
    Div = FaxUi.Div,
    FTextInput = {};

var Consts =  {
  textInputHorzPadding: 5
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
 */
FTextInput.FTextInput = {
  initState: function() {
    return { focused: false };
  },

  /* Todo: We need: OnTabAttempt, OnTextChangeAttempt, OnTabHappened
   * onEnterHappened.  OnEnterDown causing textbox change, should not trigger a
   * textChange on the mouseup.  */

  onKeyDown: function(e) {
    var nativeEvent = e.nativeEvent, keyCode = nativeEvent.keyCode;
    if (nativeEvent.keyCode === 9) {
      if (nativeEvent.shiftKey && this.props.onBackTabAttempt) {
        this.props.onBackTabAttempt(e);
      } else if (!nativeEvent.shiftKey && this.props.onTabAttempt) {
        this.props.onTabAttempt(e);
      }
    } else if (nativeEvent.keyCode === 38 && this.props.onUpArrowAttempt) {
      this.props.onUpArrowAttempt(e);
    } else if (nativeEvent.keyCode === 40 && this.props.onDownArrowAttempt) {
      this.props.onDownArrowAttempt(e);
    }
    if (this.props.onKeyDown) {
      this.props.onKeyDown(e);
    }
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
      if (this.props.onTextChange) {
        this.props.onTextChange(val);
      }
    }
    if (this.props.onEnter && nativeEvent.keyCode === 13) {
      this.props.onEnter(e);
    }
    if (this.props.onKeyUp) {
      this.props.onKeyUp(e);
    }
  },

  onBlur: function(e) {
    if (this.props.onBlurValue) {
      this.props.onBlurValue(e.target.value);
    }
    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
    return { focused: false };
  },

  onFocus: function (e) {
    if (this.props.onFocusValue) {
      this.props.onFocusValue(e.target.value);
    }
    if (this.props.onFocus) {
      this.props.onFocus(e);
    }
    return { focused: true };
  },

  project: function() {
    var P = this.props, S = this.state;
    var intendedText = P.value;
    var placeHeld = !intendedText && !S.focused;
    var textToShow = placeHeld && P.placeholder ? P.placeholder :
        intendedText ? intendedText : '';

    /* http://stackoverflow.com/questions/4577344/
     *        getting-firefox-to-stretch-an-input-properly */
    return Div({
      classSet: {
        FTextInputWrapper: true,
        ownerProvidedWrapperClassSet: P.wrapperClassSet
      },
      posInfo: P.posInfo,
      actualInput: Input({
        classSet: {
          FTextInput: true,
          FTextInputPlaceheld: !!placeHeld,
          ownerProvidedInputClassSet: P.inputClassSet
        },
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
    height: FTheme.interfaceControlsTotalHeight,
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
    backgroundColor: stylers.rgbaStr(FTheme.textInputBackgroundColor),
    margin: 0,
    display: 'inline-block',
    paddingLeft: Consts.textInputHorzPadding,
    paddingRight: Consts.textInputHorzPadding,
    border: stylers.borderValue(FTheme.textInputBorderColor),
    color: stylers.rgbaStr(FTheme.textInputFontColor),
    fontWeight: 'normal',
    fontSize: FTheme.textInputFontSize,
    '-webkit-transition': 'box-shadow .25s',
    '-moz-transition': '-moz-box-shadow .25s',
    transition: 'box-shadow .25s'
  },
  FTextInputPlaceheld: {
    color: stylers.rgbaStr(FTheme.textInputFontColorPlaceheld)
  }

};

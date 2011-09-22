/**
 * FWidgets - Stock library of Ui Widgets.
 */
var F = require('Fax'),
    FaxUi = require('FaxUi'),
    FWidgets = {};

F.using(FaxUi, FWidgets);

var CONSTS =  {
  generalHorzPadding: 5,
  FInputBgColor: '#fff',
  FInputTotalHeight: 26,
  FInputFontSize: 14,
  FInputFontColor: '#444',
  FInputFontColorPlaceheld: '#aaa',
  FInputBorderColor: '#b8b8b8',
  FInputBorderRadius: 2,

  FButtonTotalHeight: 26,
  FButtonFontSize: 14,
  FButtonFontColor: '#888',
  FButtonFontColorActive: '#333',
  FButtonBorderColor: '#b8b8b8',
  FBUttonBorderColorActive: '#888',
  FButtonBorderRadius: 2,

  FButtonBgColor: '#f1f1f1',
  FButtonBgColorBottom: '#F4F4F4',
  FButtonBgColorTop: '#F0F0F0'
};

/**
 * FWidgets.FInputView: Need to implement callbacks for text changes that are
 * 'batched' since keypresses have potential to change large portions of the dom.
 * Also, adaptive text updating depending on how long we observe each press
 * handler to take.
 */
FWidgets.EntryTypes = {
  'numeric': 1,
  'int': 2,
  'str': 3
};

FWidgets.FInputView = {
  initModel: function() {
    return {
      focused: false,
      userText: this.externallyOwned() ? this.props.value : ''
    };
  },
  externallyOwned: function() {
    return this.props.value !== undefined;
  },

  /**
   * This needs to be rethought. Let's not allow filtering for types at this low
   * level of a component, but build on top of it something with more capabilities.
   */
  onKeyDown: function(abstractEvent) {
    var nativeEvent = abstractEvent.nativeEvent, keyCode = nativeEvent.keyCode;

    /* Pressed '.' when integer mode. */
    if(this.props.entryType === 'int' && keyCode === 190) {

      abstractEvent.preventDefault();
    } else if((this.props.entryType === 'numeric' || this.props.entryType === 'int') &&
        (keyCode < 48 || keyCode > 57) &&  /* not numerics */
        keyCode !== 13 &&
        keyCode!== 8 && /* backspace */
        keyCode !== 9 && /* tab */
        (keyCode < 37 || keyCode > 39)) /* arrows */ {
      abstractEvent.preventDefault();
    }
    if (this.props.onEnter && nativeEvent.keyCode === 13) {
      this.props.onEnter();
    }
  },
  onKeyUp: function(abstractEvent) {
    var val = abstractEvent.target.value;
    if(this.model.userText !== val) {
      if (!this.externallyOwned()) {
        this.justUpdateModel({userText: val});
      } else {
        if (this.props.onChange) {
          this.props.onChange(val);
        }
      }
    }
  },
  onBlur: function(abstractEvent) {
    this.justUpdateModel({focused: true});
    this.props.onBlur &&
        this.props.onBlur(abstractEvent.nativeEvent.target.value);
  },
  project: function() {
    var props = this.props, model = this.model, style = props.style || {};
    var intendedText = this.externallyOwned() ? props.value : model.userText;
    var placeHeld = !intendedText && !model.focused;
    var textToShow = placeHeld && props.placeholder ? props.placeholder : (intendedText || '');
    return {
      overrides: {
        clssSet: this.props.additionalClssSet,
        posIno: F.extractPosInfo(this.props)
      },
      clssSet: {
        FInput: true, FInputSuper: !!props.superMode,
        FInputPlaceheld: !!placeHeld, userSuppliedClass: props.clss
      },
      type: F.TextNode(!props.secure || placeHeld ? 'text' : 'password'),
      value: F.TextNode(textToShow),
      onKeyDown: this.onKeyDown.bind(this),
      onKeyUp: this.onKeyUp.bind(this),
      onBlur: this.onBlur.bind(this),
      onFocus: this.updater({focused: true})
    }.ViewInput();
  }
};

/**
 * FWidgets.FAbsInput:
 * http://snook.ca/archives/html_and_css/absolute-position-textarea Inputs have
 * trouble with absolute positioning and getting the to fill up (stretch) to
 * their containers in the event of: 1. margins and/or paddings with absolute
 * positionings. 2. fixed offsets from parent container edges.  So here, we have
 * an input that delegates positioning to an abs positioned conainer element.
 * WARNING: Destroys the properties Properties are everything that a
 * FWidgets.FInput has plus containerClss - class added to the absolutely
 * positioned container
 */
(FWidgets.FAbsInput = {}).project = function() {
  return {
    clssSet: {abs: true},
    overrides: F.objSubset(this.props, F.POS_KEYS),
    contained: {
      w: '100%',
      overrides: F.objExclusion(this.props, F.POS_KEYS)
    }.FInputView()
  }.FView();
};

/**
 * FWidgets.FButton:
 */
(FWidgets.FButton = {}).project = function() {
  return {
    overrides: this.props,
    clssSet: {FButton: true}
  }.ViewA();
};


module.exports = F.ComponentizeAll(FWidgets);
module.exports.CONSTS = CONSTS;

/**
 * And now the styles required to make these things look decent. We take the
 * remaining space left by subtracting the border pixels (2) and text height
 * from the textbox height, and divide by two to get the top and bottom padding.
 */
module.exports.styleExports = {
  /**
   * CSS is rediculous. It's bad enough that you can't specify a height and
   * width that encompasses the border/margin/padding but different input don't
   * even come with this horrible setting by default.
   * https://developer.mozilla.org/en/CSS/box-sizing You might ask why we don't
   * just use border-box setting - (answer: because I don't know if it works in
   * all browsers. The content-box setting is at least normalizing to the
   * claimed standards.
   */
  FInput: {
    boxSizing: 'content-box', // Should add to all buttons/selects
    '-moz-box-sizing': 'content-box',
    '-webkit-box-sizing': 'content-box',
    backgroundColor: CONSTS.FInputBgColor,
    margin: 0,
    display: 'inline-block',
    paddingTop: (CONSTS.FInputTotalHeight - 2 - CONSTS.FInputFontSize)/2,
    paddingBottom: (CONSTS.FInputTotalHeight - 2 - CONSTS.FInputFontSize)/2,
    paddingLeft: 5,
    paddingRight: 5,
    height :  CONSTS.FInputFontSize,

    /** Use Fax Mixin or not: */
    border: 'solid 1px ' + CONSTS.FInputBorderColor,
    borderRadius: FaxUi.stylers.roundValue(CONSTS.FInputBorderRadius),
    color: CONSTS.FInputFontColor,
    fontWeight: 'normal',
    fontSize: CONSTS.FInputFontSize,
    '-webkit-transition': 'box-shadow .25s',
    '-moz-transition': '-moz-box-shadow .25s',
    transition: 'box-shadow .25s'
  },

  FInputPlaceheld: { color: CONSTS.FInputFontColorPlaceheld},
  FInputSuper: { fontWeight: 'bold' },
  '.FInputSuper:focus': {
    boxShadow:FaxUi.stylers.boxShadowValue(0,0,8,
                                   0, 0, 250, 0.2)
  },

  FButton: {
    /**
     * content-box should probably be added to all selects/buttons but that
     * could mess up other non-Fax elements that depend on their odd behavior.
     */
    boxSizing: 'content-box',
    '-moz-box-sizing': 'content-box',
    '-webkit-box-sizing': 'content-box',
    textAlign: 'center',
    outline: 0,
    backgroundColor: CONSTS.FButtonBgColor,
    textDecoration: 'none',
    display: 'inline-block',
    margin: 0,
    // For the button, moving two pixels from the top to the bottom.
    paddingTop: (CONSTS.FButtonTotalHeight - 2 - CONSTS.FButtonFontSize)/2 - 2,
    paddingBottom: (CONSTS.FButtonTotalHeight - 2 - CONSTS.FButtonFontSize)/2 + 2,
    paddingLeft: 5,
    paddingRight: 5,

    /*height :  CONSTS.FButtonFontSize, */
    height: CONSTS.FButtonFontSize,


    /** Use Fax Mixin or not: */
    border: 'solid 1px ' + CONSTS.FButtonBorderColor,
    borderRadius: FaxUi.stylers.roundValue(CONSTS.FButtonBorderRadius),
    color: CONSTS.FButtonFontColor,
    fontWeight: 'bold',
    fontSize: CONSTS.FButtonFontSize,
    '-webkit-transition': 'box-shadow .25s',
    '-moz-transition': '-moz-box-shadow .25s',
    transition: 'box-shadow .25s; transition: border-color: .25s',
    background: '-webkit-gradient(linear,0% 40%,0% 70%,from(' + CONSTS.FButtonBgColorBottom + '),to(' + CONSTS.FButtonBgColorBottom + '));' +
                'background: -moz-linear-gradient(linear,0% 40%,0% 70%,from(' + CONSTS.FButtonBgColorBottom + '),to(' + CONSTS.FButtonBgColorBottom + '))'
  },

  '.FButton:hover, .FButton:focus': {
      outline: 0,
      color: CONSTS.FButtonFontColorActive,
      borderColor: CONSTS.FBUttonBorderColorActive,
      boxShadow: FaxUi.stylers.boxShadowValue(0,1,2,
                                   0, 0, 0, 0.15)
  }
};

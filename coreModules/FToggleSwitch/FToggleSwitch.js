var F = require('Fax'),
    FDom = require('FDom'),
    stylers = FDom.stylers,
    FTheme = require('FTheme'), T = FTheme,
    Div = FDom.Div,
    FToggleSwitch = {};

/**
 * A toggle switch that may be 'owned' externally, meaning there is some
 * value streamed into its properties, or it may be internally owned -
 * meaning it keeps track of its own state, informing the owner via events
 * when its value changes. Note: the concept of being 'internally' owned is
 * completely worthless except in two cases:
 * 1. You just want to demo a component without streaming properties into it
 * (just for demos).
 * 2. You don't want an authoritative source of data in your app, and you rely
 * on ancient form posting methods (don't do this?)
 * In any event, we'll provide the ability for a low level component like this
 * to manage its own state.
 * We make the limitation that once something's externally owned, it must
 * always be, vice versa.
 */
FToggleSwitch.FToggleSwitch = {
  /**
   * If our value is externally owned, we don't need to keep track of it.
   */
  initState: function (initProps) {
    return this._externallyOwned(initProps) ? {} : {
      internalValue: initProps.value
    };
  },

  /**
   * If there exists a value key in the properties, someone is in charge of
   * that value, not us.
   */
  _externallyOwned: function (props) {
    return F.keyOf({value: 1}) in props;
  },

  onElementClick: function (e) {
    if (!this._externallyOwned(this.props)) {
      this.updateState({
        internalValue: !this.state.internalValue
      });
      if (this.props.onChangeValue) {
        this.props.onChangeValue(this.state.internalValue);
      }
    } else {
      if (this.props.onChangeValue) {
        this.props.onChangeValue(!this.props.value);
      }
    }
  },

  structure: function() {
    var perceivedValue = this._externallyOwned(this.props) ? this.props.value :
                         this.state.internalValue;

    return FDom.Button({
      classSet: { relZero: true, FSwitch: true },

      onClick: this.onElementClick.bind(this),

      row: Div({
        classSet: { FSwitchRow: true },
        posInfo: {
          t: 0, l: perceivedValue ? 35 : 0
        },
        offText: Div({
          classSet: { FSwitchNubText: true, FSwitchNubOffText: true },
          content: 'off'
        }),
        switchNub: Div({
          classSet: { FSwitchNub: true }
        }),
        onText: Div({
          classSet: { FSwitchNubText: true, FSwitchNubOnText: true },
          content: 'on'
        })
      })

    });
  }
};

  
module.exports = FToggleSwitch = F.ComponentizeAll(FToggleSwitch);

module.exports.styleExports = {
  FSwitchRow: {
    display: 'inline-block',
    position: 'absolute',
    height: '100%',
    boxSizing: stylers.boxSizingValue('border-box'),
    transition: stylers.transitionAllValue(0.1)
  },
  FSwitch: {
    outline: 0,
    textDecoration: 'none',
    'vertical-align': 'middle',
    cursor: 'pointer',
    width: 69,
    height: T.controlsHeight,
    boxSizing: stylers.boxSizingValue('border-box'),
    border: '0px solid transparent',
    backgroundColor: stylers.rgbaStr(T.okayBgColor),
    overflow: 'hidden'
  },
  FSwitchNub: {
    cursor: 'pointer',
    position: 'absolute',
    left: 0,
    width: 34,
    height: '100%',
    backgroundColor: stylers.rgbaStr(T.white),
    border: stylers.borderValue(T.grayBorderColor),
    boxSizing: stylers.boxSizingValue('border-box')
  },
  FSwitchNubText: {
    cursor: 'pointer',
    position: 'absolute',
    height: T.controlsHeight,
    lineHeight: T.controlsHeight - 2,
    width: 35,
    textAlign: 'center',
    'vertical-align': 'middle',
    color: stylers.rgbaStr(T.textColorSubtle),
    boxSizing: stylers.boxSizingValue('border-box')
  },
  FSwitchNubOnText: {
    left: -35,
    backgroundColor: stylers.rgbaStr(T.confirmBgColor),
    color: stylers.rgbaStr(T.confirmTextColor),
    border: stylers.borderValue(T.confirmBorderColor),
    borderRight: 'none'
  },
  FSwitchNubOffText: {
    left: 34,
    border: stylers.borderValue(T.grayBorderColor),
    borderLeft: 'none'
  }
};

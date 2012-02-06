var F = require('Fax'),
    FaxUi = require('FaxUi'),
    stylers = FaxUi.stylers,
    FTheme = require('FTheme'), T = FTheme,
    Div = FaxUi.Div,
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

  project: function() {
    var perceivedValue = this._externallyOwned(this.props) ? this.props.value :
                         this.state.internalValue;

    return FaxUi.Button({
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
    '-webkit-transition': 'all .1s ease-in-out',
    '-moz-transition': 'all .1s ease-in-out',
    '-transition': 'all .1s ease-in-out'
  },
  FSwitch: {
    outline: 0,
    textDecoration: 'none',
    'vertical-align': 'baseline',
    cursor: 'pointer',
    width: 69,
    height: T.interfaceControlsTotalHeight,
    boxSizing: stylers.boxSizingValue('border-box'),
    border: '0px solid transparent',
    backgroundColor: stylers.rgbaStr(T.normalBgColor),
    overflow: 'hidden'
  },
  FSwitchNub: {
    cursor: 'pointer',
    position: 'absolute',
    left: 0,
    width: 34,
    height: '100%',
    backgroundColor: stylers.rgbaStr(T.bgColor),
    border: stylers.borderValue(T.borderColorReallyHighContrast),
    boxSizing: stylers.boxSizingValue('border-box')
  },
  FSwitchNubText: F.merge(FaxUi.styleExports.noSelect, {
    cursor: 'pointer',
    position: 'absolute',
    height: T.interfaceControlsTotalHeight,
    lineHeight: T.interfaceControlsTotalHeight - 2,
    width: 35,
    textAlign: 'center',
    'vertical-align': 'center',
    color: stylers.rgbaStr(T.textColorReallySubtle),
    boxSizing: stylers.boxSizingValue('border-box')
  }),
  FSwitchNubOnText: {
    left: -35,
    backgroundColor: stylers.rgbaStr(T.okayBgColor),
    color: stylers.rgbaStr(T.okayTextColor),
    border: stylers.borderValue(T.contrast(T.okayBgColor, 15)),
    borderRight: 'none'
  },
  FSwitchNubOffText: {
    left: 34,
    border: stylers.borderValue(T.borderColorReallyHighContrast),
    borderLeft: 'none'
  }
};

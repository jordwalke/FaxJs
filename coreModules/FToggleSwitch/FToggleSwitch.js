var F = require('Fax'),
    FaxUi = require('FaxUi'),
    stylers = FaxUi.stylers,
    FTheme = require('FTheme'), T = FTheme,
    Div = FaxUi.Div,
    FToggleSwitch = {};

FToggleSwitch.FToggleSwitch = {
  project: function() {
    var externallyOwned = F.keyOf({value:1}) in this.props;
    console.log(this.props.value);
    return Div({
      classSet: { relZero: true, FSwitch: true },

      onClick: function(e) {
        this.props.onChangeValue(!this.props.value);
      }.bind(this),

      row: Div({
        classSet: { FSwitchRow: true },
        posInfo: {
          l: this.props.value ? 36 : 0
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
    '-webkit-transition': 'all .2s ease-in-out',
    '-moz-transition': 'all .2s ease-in-out',
    '-transition': 'all .2s ease-in-out'
  },
  FSwitch: {
    cursor: 'default',
    width: 70,
    height: T.interfaceControlsTotalHeight,
    boxSizing: stylers.boxSizingValue('border-box'),
    overflow: 'hidden'
  },
  FSwitchNub: {
    position: 'absolute',
    left: 0,
    width: 34,
    height: '100%',
    backgroundColor: stylers.rgbaStr(T.bgColor),
    border: stylers.borderValue(T.borderColorReallyHighContrast),
    boxSizing: stylers.boxSizingValue('border-box')
  },
  FSwitchNubText: {
    position: 'absolute',
    height: T.interfaceControlsTotalHeight,
    width: 35,
    textAlign: 'center',
    'vertical-align': 'center',
    color: stylers.rgbaStr(T.textColorReallySubtle),
    boxSizing: stylers.boxSizingValue('border-box')
  },
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

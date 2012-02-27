var F = require('Fax'), FDom = require('FDom'), stylers = FDom.stylers,
    T = require('FTheme'),
    Th = FDom.Th, Td = FDom.Td, Tr = FDom.Tr, Div = FDom.Div,
    Table = FDom.Table, FBoxes = {};


(FBoxes.FBox = {}).structure = function() {
  return Div({
    classSet: {
      FBox: true,
      ownerProvidedClassSet: this.props.classSet
    },
    contained: this.props.contained
  });
};

/**
 * PageDialog - has a top and bottom part.
 * The bottom has a minimum height but will stretch larger.
 */
(FBoxes.PageDialog = {}).structure = function() {
  return Div({
    classSet: this.props.classSet,
    header: Div({
      classSet: {
        PageDialogHeader: true
      },
      contained: this.props.headerContains
    }),
    footer: Div({
      classSet: {
        PageDialogFooter: true
      },
      contained: this.props.footerContains
    })
  });
};



/**
 * A two column, multi-row table for displaying information
 * such as forms.
 */
(FBoxes.InfoTable = {}).structure = function() {
  return Table(F.merge({
    classSet: {
      InfoTable: true
    }
  }, F.objMap(this.props, function(_, rowDesc) {
    return Tr({
      classSet: {
        InfoTableTr: true
      },

      leftTh: Th({
        classSet: { InfoTableTh: true },
        content: rowDesc.label + ':'
      }),

      rightTd: Td({
        classSet: { InfoTableTd: true },
        tdChild: rowDesc.rowContent
      })
    });
  })));
};

module.exports = FBoxes = F.ComponentizeAll(FBoxes);

module.exports.styleExports = {
  FBox: {
    padding: 15,
    boxSizing: stylers.boxSizingValue('border-box'),
    backgroundColor: stylers.rgbaStr(T.grayBgColor),
    border: stylers.borderValue(T.grayBgColor)
  },
  PageDialogHeader: {
    padding: 15,
    boxSizing: stylers.boxSizingValue('border-box'),
    backgroundColor: stylers.rgbaStr(T.grayLightBgColor),
    border: stylers.borderValue(T.grayLightBorderColor)
  },
  PageDialogFooter: {
    padding: 8,
    borderLeft: stylers.borderValue(T.grayLightBorderColor),
    borderRight: stylers.borderValue(T.grayLightBorderColor),
    borderBottom: stylers.borderValue(T.grayLightBorderColor),
    borderTop: 'none',
    boxSizing: stylers.boxSizingValue('border-box'),
    backgroundColor: stylers.rgbaStr(T.grayBgColor)
  },


  InfoTable: {
    'vertical-align': 'top',
    width: '100%'
  },

  InfoTableTd: {
    'vertical-align': 'top',
    paddingTop: 5
  },

  InfoTableTr: {
    width: '100%'
  },

  InfoTableTh: {
    textAlign: 'right',
    paddingTop: 8,
    paddingRight: 11,
    width: 130,
    fontSize: 11,
    color: stylers.rgbaStr(T.textColorSubtle),
    'vertical-align': 'top'
  }

};

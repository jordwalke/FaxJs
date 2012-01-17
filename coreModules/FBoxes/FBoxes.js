var F = require('Fax'), FaxUi = require('FaxUi'), stylers = FaxUi.stylers,
    T = require('FTheme'),
    Th = FaxUi.Th, Td = FaxUi.Td, Tr = FaxUi.Tr, Div = FaxUi.Div,
    Table = FaxUi.Table, FBoxes = {};

/**
 * PageDialog - has a top and bottom part.
 * The bottom has a minimum height but will stretch larger.
 */
(FBoxes.PageDialog = {}).project = function() {
  return Div({
    classSet: this.props.classSet,
    header: Div({
      classSet: {
        PageDialogHeader: true,
        PageDialogHeaderBorder: !!this.props.hasBorders
      },
      contained: this.props.headerContains
    }),
    footer: Div({
      classSet: {
        PageDialogFooter: true,
        PageDialogFooterBorder: !!this.props.hasBorders
      },
      contained: this.props.footerContains
    })
  });
};



/**
 * A two column, multi-row table for displaying information
 * such as forms.
 */
(FBoxes.InfoTable = {}).project = function() {
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
  PageDialogHeader: {
    padding: 15,
    boxSizing: stylers.boxSizingValue('border-box'),
    backgroundColor: stylers.rgbaStr(T.reallyMildBgColor),
    border: stylers.borderValue(T.reallyMildBgColor)
  },
  PageDialogFooter: {
    padding: 15,
    paddingTop: 10,
    paddingBottom: 10,
    boxSizing: stylers.boxSizingValue('border-box'),
    backgroundColor: stylers.rgbaStr(T.mildBgColor),
    border: stylers.borderValue(T.mildBgColor)
  },

  PageDialogHeaderBorder: {
    border: stylers.borderValue(T.borderColorHighContrast)
  },

  PageDialogFooterBorder: {
    borderTop: stylers.borderValue(T.mildBgColor),
    borderBottom: stylers.borderValue(T.borderColor),
    borderRight: stylers.borderValue(T.borderColor),
    borderLeft: stylers.borderValue(T.borderColor)
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

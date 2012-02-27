/**
 * ModuleName:
 */
var F = require('Fax'),
    FDom = require('FDom'),
    Div = FDom.Div,
    Span = FDom.Span,
    ModuleName = {};

F.using(ModuleName, FDom);


/**
 * ModuleName.ComponentName:
 */
ModuleName.SomeComponent = {
  project : function() {
    return Div({
      classSet: { someComponentOuterDiv: true },
      containedSpan: Span({
        content: 'A component!'
      })
    });
  }
};

module.exports = F.ComponentizeAll(ModuleName);


/*
 * Every ui module can define style exports in javascript, and a
 * css file will automatically be generated.
 */
module.exports.styleExports  = {
  myComponentOuterDiv: {
    backgroundColor: '#333',
    color: '#fff'
  }
};

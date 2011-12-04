/**
 * ModuleName:
 */
var F = require('Fax'),
    FaxUi = require('FaxUi'),
    ModuleName = {};

F.using(ModuleName, FaxUi);


/**
 * ModuleName.ComponentName:
 */
ModuleName.SomeComponent = {
  project : function() {
    return {
      classSet: { someComponentOuterDiv: true},
      containedSpan: {
        content: 'A component!'
      }.Span()
    }.Div();
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

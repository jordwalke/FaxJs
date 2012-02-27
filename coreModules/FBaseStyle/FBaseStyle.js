var F = require('Fax'),
    FDom = require('FDom'),
    stylers = FDom.stylers;

var FBaseStyle = {};

/**
 * Style module that is intended to be applied on top of a fresh css reset.
 * This module should contain useful utility classes that would be useful in
 * any application or website.
 */
module.exports.styleExports = {
  clearFix: {
    zoom: '1'
  },
 
  likeTableCell: {
    display: 'table-cell',
    'vertical-align': 'top'
  },

  likeStretchyRightTableCell: {
    display: 'table-cell',
    'vertical-align': 'top',
    width: 9000
  },

  hdn: {
    visibility: 'hidden'
  },

  block: {
    display: 'block'
  },
	ib: {
    display: 'inline-block'
  },
	abs: {
    margin: 0,
    position: 'absolute'
  },
	relZero: {
    position: 'relative',
    left:0,
    right:0
  },
	nover: {
		'-ms-overflow-x': 'hidden',
		'-ms-overflow-y': 'hidden',
		overflow: 'hidden'
	},
	cursorPointer: {
    cursor: 'pointer'
  },
	cursorDefault: {
    cursor: 'default'
  },
	cursorColResize: {
    cursor: 'col-resize'
  },
	cursorRowResize: {
    cursor: 'row-resize'
  }

};



var styleExports = module.exports.styleExports;

styleExports[stylers.afterKey({clearFix:null})] = {
  clear: 'both',
  content: '"."',
  display: 'block',
  fontSize: 0,
  height: 0,
  lineHeight: 0,
  visibility: 'hidden'
};


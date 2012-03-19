/*
 * FaxJs User Interface toolkit.
 *
 * Copyright (c) 2011 Jordan Walke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 * I am providing code in this repository to you under an open source license.
 * Because this is my personal repository, the license you receive to my code
 * is from me and not from my employer (Facebook).
 *
 */

/**
 * FDomUtils - helpful tools for either generating markup or controlling dom
 * nodes.
 */

var Fu = require('./FUtils');
var FDomAttributes = require('./FDomAttributes');
var FBrowserUtils = require('./FBrowserUtils');
var FErrors = require('./FErrors');

/* FDomAttributes */
var cssNumber = FDomAttributes.cssNumber;
var styleFeatureNames = FDomAttributes.styleFeatureNames;
var serializeInlineStyle = FDomAttributes.serializeInlineStyle;
var allTagAttrPieces = FDomAttributes.allTagAttrPieces;

/* FBrowserUtils */
var escapeTextForBrowser = FBrowserUtils.escapeTextForBrowser;

/* FEvent */
var FEvent = require('./FEvent');
var registerHandlers = FEvent.registerHandlers;
var registerHandlerByName = FEvent.registerHandlerByName;
var abstractHandlerTypes = FEvent.abstractHandlerTypes;

/**
 * Does not work correctly with tables etc.
 */
var singleDomNodeFromMarkup =
exports.singleDomNodeFromMarkup = function(newMarkup) {
  var elemIdx, div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--){
    return elements[elemIdx];
  }
  throw FErrors.COULD_NOT_CREATE_SINGLE_DOM;
};


/**
 * tagAttrMarkupFragment: For attributes that should be rendered in the opening
 * tag of a dom node, this will return that little fragment that should be
 * placed in the opening tag - for this single attribute. allTagAttrPieces
 * preconcatenates some of the markup (equals sign).
 */
var tagAttrMarkupFragment =
exports.tagAttrMarkupFragment = function(tagAttrName, tagAttrVal) {
  var accum = allTagAttrPieces[tagAttrName];
  accum += escapeTextForBrowser(tagAttrVal);
  accum += "'";
  return accum;
};


/**
 * Inserts node after 'after'. If 'after' is null, inserts it after nothing,
 * which is inserting it at the beginning.
 */
var insertNodeAfterNode =
exports.insertNodeAfterNode =function(elem, insert, after) {
  if (after) {
    if (after.nextSibling) {
       return elem.insertBefore(insert, after.nextSibling);
    } else {
      return elem.appendChild(insert);
    }
  } else {
    return elem.insertBefore(insert, elem.firstChild);
  }
};


/**
 * Does not work correctly with tables etc.  Allocate new material. #testIE
 * http://stackoverflow.com/questions/494143/
 * how-do-i-create-a-new-dom-element-from-
 * an-html-string-using-built-in-dom-methods
 */
var appendMarkup = exports.appendMarkup = function(elem, newMarkup) {
  var elemIdx, div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--) {
    elem.appendChild(elements[elemIdx]);
  }
};

/*
 */

/**
 * @renderClassSets: Renders a list of class sets. Useful when wanting to merge
 * a class set with one or more class sets provided by another software layer.
 * Inlines the renderClassSet method for performance reasons.
 *
 * -Key-value objects are leaf nodes in an array based tree. Arrays may contain
 *  arrays, but key-value className objects may not contain arrays.
 * -
 * -  classSets: [
 * -     {BigButton: true, AlertButton: true},
 * -     [{RedButton: this.props.isRed}, this.props.passedInClassSet]
 * -  ];
 */
var renderClassSets = exports.renderClassSets = function(classSetList) {
  var accum = '', shouldInclude, childSet, nameOfClass, i;
  if (!classSetList) {
    return '';
  }
  for (i=0; i < classSetList.length; i=i+1) {
    childSet = classSetList[i];
    /* It's not a key-value object, rather a nested array. */
    if (childSet instanceof Array) {
      accum += renderClassSets(childSet);
    } else {
      for (nameOfClass in childSet) {
        if (!childSet.hasOwnProperty(nameOfClass)) {
          continue;
        }
        shouldInclude = childSet[nameOfClass];
        if (shouldInclude) {
          accum += nameOfClass;
          accum += ' ';
        }
      }
    }
  }
  return accum;
};

/**
 * @renderClassSet: Entry point for rendering css class strings. ProTip: For
 * class sets that are constant, declare a variable at the top of your file to
 * avoid an additional object being allocated upon each "structure()"
 * invocation.
 */
var renderClassSet = exports.renderClassSet = function(namedSet) {
  if (namedSet instanceof Array) {
    return renderClassSets(namedSet); /*plural*/
  }
  var accum = '', nameOfClass, shouldInclude;
  for (nameOfClass in namedSet) {
    if (!namedSet.hasOwnProperty(nameOfClass)) {
      continue;
    }
    shouldInclude = namedSet[nameOfClass];
    if (shouldInclude) {
      accum += nameOfClass;
      accum += ' ';
    }
  }
  return accum;
};



/**
 * Convert a value into the proper css writable value. We shouldn't need to
 * convert NaN/null because we shouldn't have even gotten this far. The
 * attribute name should be logical (no hyphens).
 */
var _styleValue = function(logicalStyleAttrName, attrVal) {
  if(!isNaN(attrVal)) {
    return cssNumber[logicalStyleAttrName] ? attrVal : (attrVal + 'px');
  }
  if(attrVal !== 0 && !attrVal) {
    return '';
  }
  return attrVal;
};

/**
 * serializeInlineStyle: {width: '200px', height:0} => "
 * style='width:200px;height:0'". Undefined values in the style object are
 * completely ignored. That makes declarative programming easier.
 */
var serializeInlineStyle = exports.serializeInlineStyle = function(styleObj) {
  var accum = '', logStyleAttrName, styleAttrVal;
  for (logStyleAttrName in styleObj) {
    if (!styleObj.hasOwnProperty(logStyleAttrName)) {
      continue;
    }
    styleAttrVal = styleObj[logStyleAttrName];
    if (styleAttrVal !== undefined) {
      accum +=
        styleFeatureNames[logStyleAttrName] || (';' + logStyleAttrName + ':');
      accum += _styleValue(logStyleAttrName, styleAttrVal);
    }
  }
  return accum;
};


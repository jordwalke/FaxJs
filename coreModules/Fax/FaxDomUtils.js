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
 * FaxJs tends to not touch the dom very much. Therefore, there won't be much
 * code in this module. That's generally a good thing. Components should rarely
 * even need to manipulate or reason about the DOM.
 */

var ERROR_MESSAGES = {
  COULD_NOT_CREATE_SINGLE_DOM: "Could not create single dom node"
};


/**
 * Does not work correctly with tables etc.
 */
var singleDomNodeFromMarkup = exports.singleDomNodeFromMarkup = function(newMarkup) {
  var elemIdx, div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--){
    return elements[elemIdx];
  }
  throw ERROR_MESSAGES.COULD_NOT_CREATE_SINGLE_DOM;
};


/**
 * Inserts node after 'after'. If 'after' is null, inserts it after nothing,
 * which is inserting it at the beginning.
 */
var insertNodeAfterNode = exports.insertNodeAfterNode =function (elem, insert, after) {
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
 * Does not work correctly with tables etc.
 *
 */
var appendMarkup = exports.appendMarkup = function(elem, newMarkup) {
  var elemIdx, div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--) {
    elem.appendChild(elements[elemIdx]);
  }
};

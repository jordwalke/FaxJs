/**
 * FaxJs tends to not touch the dom very much. Therefore, there won't be much
 * code in this module. That's generally a good thing.
 */

var ERROR_MESSAGES = {
  COULD_NOT_CREATE_SINGLE_DOM: "Could not create single dom node"
};


/**
 * Does not work correctly with tables etc.
 */
var singleDomNodeFromMarkup = function (newMarkup) {
  var elemIdx, div = document.createElement('div');
  div.innerHTML = newMarkup;
  var elements = div.childNodes;
  for (elemIdx = elements.length - 1; elemIdx >= 0; elemIdx--){
    return elements[elemIdx];
  }
  throw ERROR_MESSAGES.COULD_NOT_CREATE_SINGLE_DOM;
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

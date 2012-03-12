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

var F = require('Fax');
var FDomGeneration = F.FDomGeneration;
var FDomMutation = F.FDomMutation;

/* FDomGeneration */
var generateDomChildrenByKey = FDomGeneration.generateDomChildrenByKey;
var reconcileDomChildrenByKey = FDomMutation.reconcileDomChildrenByKey;

/**
 * @FMultiClass: This is essentially a Div component without the ability to
 * control attributes or events. This should be used when the key of a child can
 * completely be used to identify that child. Across multiple doControls, if we
 * see that a child has changed positions, we will make sure to swap their dom
 * locations, but keep track of internal state within each child.
 */
var FMultiClass = function(initProps) {
  this.props = initProps;
};

FMultiClass.prototype.doControl = function(props) {
  reconcileDomChildrenByKey.call(this, props);
};

/**
 * @genMarkup: Since this component has no event handlers that would reference
 * this.props, we can delete props when we're done with them.
 */
FMultiClass.prototype.genMarkup = function(idRoot, doMarkup, doHandlers) {
  var ret = '<div id="';
  this._rootDomId = idRoot;
  if (doMarkup) {
    ret += idRoot;
    ret += '" style="display:inherit">';
    ret += generateDomChildrenByKey.call(
        this, idRoot, this.props, doMarkup, doHandlers);
    ret += "</div>";
    /* Since this component has no event handlers that would reference
     * this.props, we can delete props when we're done with them. */
    delete this.props; 
    return ret;
  } else {
    generateDomChildrenByKey.call(
        this, idRoot, this.props, doMarkup, doHandlers);
    delete this.props;
  }
};

/**
 * @FMulti: Convenience constructor for declaratively building an instance of
 * FMultiClass without using the "new" keyword. In fact, the outside world
 * doesn't even need to know that a FMulti is even related to FMultiClass. A
 * container of several same-typed subcomponents each element.
 */
exports.FMulti = function(propsParam) {
  var props = propsParam || this;
  return new FMultiClass(props);
};

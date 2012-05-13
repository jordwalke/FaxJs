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
var FUtils = F.FUtils;
var FDomUtils = F.FDomUtils;
var FDomGeneration = F.FDomGeneration;
var FDomMutation = F.FDomMutation;
var FErrors = F.FErrors;

/* FDomGeneration */
var generateDomChildrenByArray = FDomGeneration.generateDomChildrenByArray;

/* FDomMutation */
var reconcileDomChildrenByArray = FDomMutation.reconcileDomChildrenByArray;

/**
 * @FOrderedClass: A reactive component with an Array based API. Should only be
 * used in cases when an element's position in the array can be used to
 * completely identify an instance of a component. Should not be used when a
 * child could switch positions in the array across multiple updateAllProps calls.
 * What will happen, is the FOrderedClass component will try to control the
 * instance at one location "into being the next component".  So when component
 * descriptions swap places, state remains at the old index.  Sometimes this is
 * acceptable and sometimes not. Obviously not if the component instances being
 * swapped have incompatible APIs. When in doubt, use a Multi instead, which
 * resolves all of these issues by using the power of javascript's ordered sets
 * (regular js objects, where elements have both order *and* identity).
 */
var FOrderedClass = function(initProps) {
  this.props = initProps;
};

/**
 * At this point, this.children is as before appending or deleting any children,
 * but props is the new properties.
 */
FOrderedClass.prototype.updateAllProps = function(props) {
  reconcileDomChildrenByArray.call(this, props);
};


/*
 * @genMarkup: Since this component has no event handlers that would reference
 * this.props, we can delete props when we're done with them.
 */
FOrderedClass.prototype.genMarkup = function(idRoot, doMarkup, doHandler) {
  var ret = '<div id="';
  this._rootDomId = idRoot;
  if (doMarkup) {
    ret += idRoot;
    ret += '" style="display:inherit">';
    ret += generateDomChildrenByArray.call(
      this, idRoot, this.props, doMarkup, doHandler);
    ret += "</div>";
    /* Since this component has no event handlers that would reference
     * this.props, we can delete props when we're done with them. */
    delete this.props; 
    return ret;
  } else {
    generateDomChildrenByArray.call(
      this, idRoot, this.props, doMarkup, doHandler);
    delete this.props;
  }
};

/**
 * @FOrdered: Convenience constructor for declaratively building an instance of
 * FOrderedClass without having to use the "new" keyword. A container of several
 * same-typed subcomponents each element in the properties passed in must all
 * accept the same properties (in other words implement the same interface.
 */
exports.FOrdered = function(propsParam) {
  var props = propsParam || this;
  return new FOrderedClass(props);
};

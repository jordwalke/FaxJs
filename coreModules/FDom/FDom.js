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
 * FDom/FDom.js - core dom module for the FaxJs ui system. Low level building
 * blocks for javascript applications.
 */
var F = require('Fax'),
    FComp = F.FaxComponentization,
    FaxUiStylers = require('./FaxUiStylers'),
    FDom = {};



/**
 * Native dom "tag" components. Properties that you inject into these projection
 * constructors correspond to actual dom properties, not abstract ones.
 */
FDom.Div = FComp.makeDomContainerComponent('div');
FDom.TextArea = FComp.makeDomContainerComponent('textarea');
FDom.Label = FComp.makeDomContainerComponent('label');
FDom.Ul = FComp.makeDomContainerComponent('ul');
FDom.Dl = FComp.makeDomContainerComponent('dl');
FDom.Dt = FComp.makeDomContainerComponent('dt');
FDom.Dd = FComp.makeDomContainerComponent('Dd');
FDom.P = FComp.makeDomContainerComponent('p');
FDom.Pre = FComp.makeDomContainerComponent('pre');
FDom.Hr = FComp.makeDomContainerComponent('hr');
FDom.Br = FComp.makeDomContainerComponent('br');
FDom.Img = FComp.makeDomContainerComponent('img');
FDom.A = FComp.makeDomContainerComponent('a');
FDom.Li = FComp.makeDomContainerComponent('li');
FDom.I = FComp.makeDomContainerComponent('i');
FDom.H1 = FComp.makeDomContainerComponent('h1');
FDom.H2 = FComp.makeDomContainerComponent('h2');
FDom.H3 = FComp.makeDomContainerComponent('h3');
FDom.H4 = FComp.makeDomContainerComponent('h4');
FDom.H5 = FComp.makeDomContainerComponent('h5');
FDom.H6 = FComp.makeDomContainerComponent('h6');
FDom.Span = FComp.makeDomContainerComponent('span');
FDom.Input = FComp.makeDomContainerComponent('input');
FDom.Button = FComp.makeDomContainerComponent('button');
FDom.Table = FComp.makeDomContainerComponent('table');
FDom.Tr = FComp.makeDomContainerComponent('tr');
FDom.Th = FComp.makeDomContainerComponent('th');
FDom.Td = FComp.makeDomContainerComponent('td');
FDom.IFrame = FComp.makeDomContainerComponent('iframe');


/*
 * FDom.Ordered: A container of several same-typed subcomponents each element
 * in the properties passed in must all accept the same properties (in other
 * words implement the same interface.
 */
var OrderedConstructor = FComp.MakeComponentClass({},[FComp.OrderedComponentMixin]);
FDom.Ordered = function(propsParam) {
  var props = propsParam || this;
  return {
    props: props,
    maker: OrderedConstructor
  };
};


/*
 * FDom.MultiDynamic: A container of several same-typed subcomponents each
 * element in the properties passed in must all accept the same properties (in
 * other words implement the same interface.
 */
var MultiDynamicConstructor =
    FComp.MakeComponentClass({},[FComp.MultiDynamicComponentMixin]);
FDom.MultiDynamic = function(propsParam) {
  var props = propsParam || this;
  return {
    props: props,
    maker: MultiDynamicConstructor
  };
};


module.exports = FComp.ComponentizeAll(FDom);
module.exports.stylers = FaxUiStylers;

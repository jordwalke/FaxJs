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
 * FaxUi/FaxUi.js - core dom module for the FaxJs ui system. Low level building
 * blocks for javascript applications.
 */
var F = require('Fax'),
    FComp = F.FaxComponentization,
    FaxUiStylers = require('./FaxUiStylers'),
    FaxUi = {};



/**
 * Native dom "tag" components. Properties that you inject into these projection
 * constructors correspond to actual dom properties, not abstract ones.
 */
FaxUi.Div = FComp.makeDomContainerComponent('div');
FaxUi.TextArea = FComp.makeDomContainerComponent('textarea');
FaxUi.Label = FComp.makeDomContainerComponent('label');
FaxUi.Ul = FComp.makeDomContainerComponent('ul');
FaxUi.Dl = FComp.makeDomContainerComponent('dl');
FaxUi.Dt = FComp.makeDomContainerComponent('dt');
FaxUi.Dd = FComp.makeDomContainerComponent('Dd');
FaxUi.P = FComp.makeDomContainerComponent('p');
FaxUi.Pre = FComp.makeDomContainerComponent('pre');
FaxUi.Hr = FComp.makeDomContainerComponent('hr');
FaxUi.Br = FComp.makeDomContainerComponent('br');
FaxUi.Img = FComp.makeDomContainerComponent('img');
FaxUi.A = FComp.makeDomContainerComponent('a');
FaxUi.Li = FComp.makeDomContainerComponent('li');
FaxUi.I = FComp.makeDomContainerComponent('i');
FaxUi.H1 = FComp.makeDomContainerComponent('h1');
FaxUi.H2 = FComp.makeDomContainerComponent('h2');
FaxUi.H3 = FComp.makeDomContainerComponent('h3');
FaxUi.H4 = FComp.makeDomContainerComponent('h4');
FaxUi.H5 = FComp.makeDomContainerComponent('h5');
FaxUi.H6 = FComp.makeDomContainerComponent('h6');
FaxUi.Span = FComp.makeDomContainerComponent('span');
FaxUi.Input = FComp.makeDomContainerComponent('input');
FaxUi.Button = FComp.makeDomContainerComponent('button');
FaxUi.Table = FComp.makeDomContainerComponent('table');
FaxUi.Tr = FComp.makeDomContainerComponent('tr');
FaxUi.Th = FComp.makeDomContainerComponent('th');
FaxUi.Td = FComp.makeDomContainerComponent('td');
FaxUi.IFrame = FComp.makeDomContainerComponent('iframe');


/*
 * FaxUi.Ordered: A container of several same-typed subcomponents each element
 * in the properties passed in must all accept the same properties (in other
 * words implement the same interface.
 */
var OrderedConstructor = FComp.MakeComponentClass({},[FComp.OrderedComponentMixin]);
FaxUi.Ordered = function(propsParam) {
  var props = propsParam || this;
  return {
    props: props,
    maker: OrderedConstructor
  };
};


/*
 * FaxUi.MultiDynamic: A container of several same-typed subcomponents each
 * element in the properties passed in must all accept the same properties (in
 * other words implement the same interface.
 */
var MultiDynamicConstructor =
    FComp.MakeComponentClass({},[FComp.MultiDynamicComponentMixin]);
FaxUi.MultiDynamic = function(propsParam) {
  var props = propsParam || this;
  return {
    props: props,
    maker: MultiDynamicConstructor
  };
};


module.exports = FComp.ComponentizeAll(FaxUi);
module.exports.stylers = FaxUiStylers;


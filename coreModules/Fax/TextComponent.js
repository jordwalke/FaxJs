/**
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


/* FBrowserUtils */
var FBrowserUtils = require('./FBrowserUtils');
var escapeTextForBrowser = FBrowserUtils.escapeTextForBrowser;

/* FDomAttributes */
var FDomAttributes = require('./FDomAttributes');
var CONTENT_ACCESSOR_KEY = FDomAttributes.CONTENT_ACCESSOR_KEY;

/**
 * @TextComponent: a component that the dom traversal masks strings as so that
 * the same universal reconciliation algorithm can be applied to text. This
 * means even text children will be able to be repositioned reactively. When
 * FDomMutation/Generation support text children themselves, this masking won't
 * be necessary.
 */
var TextComponent = function(initPropsText) {
  this.props = initPropsText;
};

/**
 * @updateAllProps: Controls a native dom component after it has already been
 * allocated and attached to the dom - just updates the text.
 * - Just need to set the text content.
 * - props is of type string - unlike most other components.
 */
TextComponent.prototype.updateAllProps = function(newText) {
  /* Control the header (and any content property) */
  var rootDomNode = this.rootDomNode;
  if (newText !== this.props) {
    if (!rootDomNode) {
      rootDomNode = this.rootDomNode = document.getElementById(this._rootDomId);
    }
    rootDomNode[CONTENT_ACCESSOR_KEY] = newText;
    this.props = newText;
  }
};

/**
 * @genMarkup:
 * - Creates an instance of a new node type 'text'
 * - The node is not intended to have any other features besides content.
 */
TextComponent.prototype.genMarkup = function(idRoot) {
  this._rootDomId = idRoot;
  return (
    '<text id="' + idRoot + '">' +
      escapeTextForBrowser(this.props) +
    '</text>'
  );
};

module.exports = TextComponent;

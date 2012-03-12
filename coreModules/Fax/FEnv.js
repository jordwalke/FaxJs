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
 * FEnv.js - Environment module.
 */
var FBrowserUtils = require('./FBrowserUtils');

var FEnv = module.exports = {
  currentScrollLeft: 0,
  currentScrollTop: 0,
  viewportHeight: 0,
  viewportWidth: 0,
  browserInfo: null,
  refreshAuthoritativeScrollValues: function() {
    FEnv.currentScrollLeft =
      document.body.scrollLeft + document.documentElement.scrollLeft;
    FEnv.currentScrollTop =
      document.body.scrollTop + document.documentElement.scrollTop;
  },
  refreshAuthoritativeViewportValues: function() {
    var dims = FBrowserUtils.getViewportDims();
    FEnv.viewportHeight = dims.viewportHeight;
    FEnv.viewportWidth = dims.viewportWidth;
  },
  ensureBrowserDetected: function() {
    FEnv.browserInfo = FBrowserUtils.browserDetection();
  }
  
};

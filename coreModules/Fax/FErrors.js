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
module.exports = {
  COULD_NOT_CREATE_SINGLE_DOM: "Could not create single dom node",
  CANNOT_SET_INNERHTML: "YOU CANNOT EVER SET INNERHTML. You must use the " +
    "name that evokes what is really going on. dangerouslySetInnerHtml",
  MUST_SPECIFY_TOP_COMP: "You must specify a top level constructor - or " +
    "component declarative creation specification - i.e. " +
    "{something:x}.Div(). What you specified appears " +
    "to be null or not specified. If " +
    "specifying a declarative block - make sure you execute " +
    "F.using(moduleContainingTopmostComponent) in the file where " +
    "you render the top level component.",
  NAMESPACE_FALSEY: "Namespace is falsey wtf!",
  CLASS_NOT_COMPLETE: "Class does not implement required functions!",
  NO_DOM_TO_HIDE: "No DOM node to hide!",
  CONTROL_WITHOUT_BACKING_DOM: "Trying to control a native dom element " +
                               "without a backing id",
  UPDATE_STATE_PRE_PROJECT: "Cannot update state before your done projecting!!",
  FAILED_ASSERTION: "Assertion Failed - no error message given",
  NO_TOP_LEVEL_ID: "You must at least specify a top " +
    "level id to mount at. The second " +
    "parameter of renderTopLevelComponentAt must either be a string (the " +
    "id to render at) or an object containing a mountAtId field",
  MERGE_DEEP_ARRAYS: 'Cannot mergeDeep arrays',

  throwIf: function(b, err) {
    if (b) { throw err; }
  }
};


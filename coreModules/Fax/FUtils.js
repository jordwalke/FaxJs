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

var FErrors = require('./FErrors');

/**
 * If we use this, then a shim is absolutely required.
 */
var _eq = exports.eq = function(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

exports.clone = function(o) {
 return JSON.parse(JSON.stringify(o));
};

exports.serialize = function(o) {
 return JSON.stringify(o);
};

/**
 * Merges into an existing object - as in "merges" then "stuffs" into ths. Since
 * we have the luxury of mutating ths, we can apply a shortcut when we see that
 * merge is falsey - we can just return ths!
 */
exports.mergeStuff = function(ths, merge) {
  var aKey;
  for (aKey in merge) {
    if (!merge.hasOwnProperty(aKey)) {
      continue;
    }
    ths[aKey] = merge[aKey];
  }
  return ths;
};

/**
 * Fax.merge: Two has priority over one. This version only works on two objs
 * accessing arguments can be very slow, since the browser has to instantiate a
 * new object to represent them, if it sees you reference 'arguments' in the
 * code. Since this is used in critical sections of code - the redundancy is
 * welcomed. Let's make an array based one for the 'mergeN' case.
 */
exports.merge = function(one, two) {
  var ret = {}, aKey, first = one || {}, second = two || {};
  for (aKey in first) {
    if (first.hasOwnProperty(aKey)) {
      ret[aKey] = first[aKey];
    }
  }
  for (aKey in second) {
    if (second.hasOwnProperty(aKey)) {
      ret[aKey] = second[aKey];
    }
  }
  return ret;
};

/**
 * Merges all parameters together into a new object - shallowly of course. This
 * is slower because it uses the arguments keyword. Don't use in the critical
 * path.
 */
exports.mergeAll = function(/*arguments*/) {
  var i, key, arg, ret = {};
  for (i=0; i < arguments.length; i=i+1) {
    arg = arguments[i];
    exports.mergeStuff(ret, arg);
  }
  return ret;
};

exports.mergeThree = function(one, two, three) {
  var ret = {}, aKey, first = one || {}, second = two || {}, third = three || {};

  for (aKey in first) {
    if (first.hasOwnProperty(aKey)) {
      ret[aKey] = first[aKey];
    }
  }
  for (aKey in second) {
    if (second.hasOwnProperty(aKey)) {
      ret[aKey] = second[aKey];
    }
  }
  for (aKey in third) {
    if (third.hasOwnProperty(aKey)) {
      ret[aKey] = third[aKey];
    }
  }
  return ret;
};

/*
 * Will not work on arrays. Undefined is used as a signal to not place that
 * element into the returned object. obj2 has precedence over obj1. This
 * function is not intended to merge two objects, but rather to update one
 * object with another object that is used as the signal for change.  May or may
 * not mutate obj1. If obj1 is a terminal, it will not mutate obj1 and instead
 * return the new reference. Iff obj1 is 'objecty' and obj2 is 'objecty' then
 * this will mutate obj1. Probably doesn't work in some edge cases.
 */
exports.mergeDeep = function(obj1, obj2) {
  var obj2Key;
  FErrors.throwIf(obj1 instanceof Array || obj2 instanceof Array,
    FErrors.MERGE_DEEP_ARRAYS);
  var obj2Terminal =
    obj2 === undefined || obj2 === null || typeof obj2 === 'string' ||
    typeof obj2 === 'number' || typeof obj2 === 'function' || obj2 === true ||
    obj2 === false;

  if(obj2Terminal) {
    return obj2;
  }
  var obj1Terminal =
    obj1 === undefined || obj1 === null || typeof obj1 === 'string' ||
    typeof obj1 === 'number' || typeof obj1 === 'function' || obj1 === true ||
    obj1 === false;

  // Wipe out
  if(obj1Terminal) {
    obj1 = obj1 || {};
  }

  for (obj2Key in obj2) {
    if (!obj2.hasOwnProperty(obj2Key)) {
      continue;
    }
    obj1[obj2Key] = exports.mergeDeep(obj1[obj2Key], obj2[obj2Key]);
  }

  return obj1;

};

/**
 * Simply copies properties to the prototype.
 */
exports.mixin = function(constructor, methodBag) {
  var methodName;
  for (methodName in methodBag) {
    if (!methodBag.hasOwnProperty(methodName)) {continue;}
    constructor.prototype[methodName] = methodBag[methodName];
  }
};

/**
 * Probably not fast - use only for constant setup etc.
 */
exports.hyphenize = function(str) {
  var i, res = '';
  for (i=0; i < str.length; i=i+1) {
    if (str[i].toUpperCase() === str[i]) {
      res += '-' + str[i].toLowerCase();
    } else {
      res += str[i];
    }
  }
  return res;
};

/**
 * Maybe invokes the function, if it exists that is.
 */
exports.maybeInvoke = function(f) {
  if (f) {
    f();
  }
};

/**
 * Invokes a handler *now* for each element in the cross product of two arrays.
 * The 'now' distinction is important as it allows the opportunity to mutate
 * whatever context happens to be in the closure of the handler.  Poorly named
 * as it does not return the cross product, but just provides an opportunity for
 * the handler to be invoked for each combination of arr elems.
 */
exports.crossProduct = function(arr1, arr2, handler) {
  var i, j;
  for (i=0; i < arr1.length; i++) {
    for (j=0; j < arr2.length; j++) {
      handler(arr1[i], arr2[j]);
    }
  }
};

exports.truther = function() {
  return true;
};

exports.falser = function() {
  return false;
};

/**
 * Finds an index of an item that has a particular structure. The structure is
 * checked by using stringify.
 */
exports.indexOfStruct = function(searchArr, obj) {
  var i;
  for (i=0; i < searchArr.length; i=i+1) {
    if (_eq(obj, searchArr[i])) {
      return i;
    }
  }
  return -1;
};

exports.structExists = function (searchArr, obj) {
  return exports.indexOfStruct(searchArr, obj) !== -1;
};

/**
 * Fax.objMap - the key should probably be the second parameter to play nicer
 * with other functions.
 */
exports.objMap = function (obj, fun, context) {
  var ret = {}, key, i = 0;
  if (!obj) {
    return obj;
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = fun.call(context || this, key, obj[key], i++);
  }
  return ret;
};

exports.swapKeyOrder = function(obj, singleKeyed, anotherSingleKeyed) {
  // todo
};

/**
 * Accepts an object, and for each own property, calls mapper, while
 * constructing an array to return.
 */
exports.objMapToArray = function(obj, mapper, context) {
  var ret = [], aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey)) {
      ret.push(mapper.call(context || this, aKey, obj[aKey]));
    }
  }
  return ret;
};

/**
 * Mapper must return {key: x, value: y} If mapper returns undefined, no entry
 * in the ret will be made.  It must not return null.
 */
exports.arrMapToObj = function(arr, mapper) {
  var ret = {}, res, i, len = arr.length;
  for(i=0; i < len; i++) {
    res = mapper(arr[i], i);
    ret[res.key] = res.value;
  }
  return ret;
};

exports.map = function(arr, fun, context) {
  var i, res = [];
  if (!arr) {
    return arr;
  }
  for (i = 0; i < arr.length; i = i + 1) {
    res[i] = fun.call(context || this, arr[i], i);
  }
  return res;
};

exports.arrToObj = function(arr, keyPrefixParam) {
  var i, ret = {}, keyPrefix = keyPrefixParam || 'key';
  if(!arr) {
    return arr;
  }
  for(i=0; i < arr.length; i++) {
    ret['' + keyPrefix + i] = arr[i];
  }
  return ret;
};

exports.mapSlice = function(arr, fun, start, length, context) {
  var i, res = [], end = start + length - 1, arrLen = arr && arr.length;
  if (!arr) {
    return arr;
  }
  for (i = start; i <= end && i < arrLen; i = i + 1) {
    res[i-start] = fun.call(context || this, arr[i], i - start);
  }
  return res;
};

/**
 * Like mapSlice, but informs the callback of each elements position in the
 * original array (as opposed to its position in the slice)
 */
exports.mapRange = function(arr, fun, start, length, context) {
  var i, res = [], end = start + length - 1, arrLen = arr && arr.length;
  if (!arr) {
    return arr;
  }
  for (i = start; i <= end && i < arrLen; i = i + 1) {
    res[i-start] = fun.call(context || this, arr[i], i);
  }
  return res;
};

/**
 * Selects a subset of arr preserving order, calling the mapper for each as if
 * that subset is a new array, "reordering". In other words treats the selected
 * indices as a new subsequence of the original array.
 */
exports.mapSubSequence = function(arr, indicesArr, fun, context) {
  var i, res = [], len = indicesArr.length;
  for (i=0; i < len; i=i+1) {
    res[i] = fun.call(context || this, arr[indicesArr[i]], i);
  }
  return res;
};

/**
 * Selects a subset of arr preserving order, calling the mapper for each as if
 * but preserving the original specific indices - not reordering them.
 */
exports.mapIndices = function(arr, indicesArr, fun, context) {
  var i, res = [];
  for (i=0; i < indicesArr.length; i=i+1) {
    res[i] = fun.call(context || this, arr[indicesArr[i]], indicesArr[i]);
  }
  return res;
};



/* should just use underscore */
exports.reduce = function(arr, fun, init, context) {
  return arr.reduce(fun, init, context);
};

/**
 * @objMapFilter: Same as objMap, but filters out any undef result of callback
 * invocation. The returned object won't even have keys for keys that the
 * callback returns undefined.  Note, you *must* return undefined, to indicate
 * that the key should have no presence in the final object and not false/null.
 * Accepts a prefilter as well, indicating a map (keys) to avoid invoking the
 * callback for.
 */
exports.objMapFilter = function(obj, fun, preFilter) {
  var mapped, key;
  if (!obj) {
    return obj;
  }
  var ret = {};
  for (key in obj) {
    if (!obj.hasOwnProperty(key) || preFilter && preFilter[key]) {
      continue;
    }
    mapped = fun(key, obj[key]);
    if (mapped !== undefined) {
      ret[key] = mapped;
    }
  }
  return ret;
};

exports.arrPull = function(arr, key) {
  var q, res = [];
  if (!arr) {
    return arr;
  }
  for (q = 0; q < arr.length; q = q + 1) {
    res[q] = arr[q][key];
  }
  return res;
};

exports.arrPullJoin = function(arr, key) {
  var q, res = [];
  if (!arr) {
    return arr;
  }
  for (q = 0; q < arr.length; q = q + 1) {
    res = res.concat(arr[q][key]);
  }
  return res;
};

/*
 * Returns an object map of the form: valueOfByKey => [items where byKey equals
 * valueOfByKey]. Note, if the value in byKey for any item is an object, it will
 * be automatically stringified by the system since we're creating a 'JSON'
 * style map as the return value. A more detailed (and slower) implementation
 * would map categorize by structural value. We could create a similar function
 * that allows us to 'tag' objects, allowing an item to exist in more than one
 * category. Will filter out objects that are null or undefined. All objects
 * that have nothing for that key will be categorized by the 'undefined'
 * category.
 */
exports.arrCategorize = function(arr, byKey) {
  var i, item, ret = {};
  if (!arr) {
    return {};
  }
  var categoryArr;
  for (i = 0; i < arr.length; i = i + 1) {
    item = arr[i];
    if (item !== undefined && item !== null) {
      if (!ret[item[byKey]]) {
        ret[item[byKey]] = [];
      }
      ret[item[byKey]].push(item);
    }
  }
  return ret;
};



/**
 * Mapper should just return the value for which this function will create
 * string keys for. Each string key will not appear to be numeric, and therefore
 * will experience order preservation. You can't decide the key though, it will
 * simply be 'nNumber' (so as not to appear numeric).
 */
exports.arrMapToObjAutoKey = function(arr, mapper) {
  var ret = {}, i, len = arr.length;
  for(i=0; i < len; i++) {
    ret['n' + i] = mapper(arr[i], i);
  }
  return ret;
};


/**
 * @keys: #todoperf reduce to native when available #todocustombuild
 */
exports.keys = function(obj) {
  var ret = [], aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey)) {
      ret.push(aKey);
    }
  }
  return ret;
};

exports.keyCount = function(obj) {
  return exports.keys(obj).length;
};

/**
 * @objSubset: selects a subset of object fields as indicated by the select
 * map.  Any truthy value in the corresponding select map will indicate that the
 * corresponding object field should be sliced off into the return value.
 * #todoperf reduce to native when available. #todocustombuild.
 */
exports.objSubset = function(obj, selectMap) {
  var ret = {}, aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey) && selectMap[aKey]) {
      ret[aKey] = obj[aKey];
    }
  }
  return ret;
};

/**
 * Fax.objExclusion: Compliment to Fax.objSubset.
 */
exports.objExclusion = function(obj, filterOutMapParam) {
  var ret = {}, filterOutMap = filterOutMapParam || {}, aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey) && !filterOutMap[aKey]) {
      ret[aKey] = obj[aKey];
    }
  }
  return ret;
};


exports.copyProps = function(obj, obj2) {
  var key;
  for (key in obj2) {
    if (!obj2.hasOwnProperty(key)) {
      continue;
    }
    obj[key] = obj2[key];
  }
  return obj;
};

exports.shallowClone = function(obj) {
  return exports.copyProps({}, obj);
};


/**
 * Probably better than prototypical extension because we can reason about
 * nullness more gracefully. This version just takes one in the construction
 * because arguments access can be very slow. Though the returned function needs
 * to look at *it's* arguments. For a single value case - where even the
 * returned function expects only one argument - use curryOnly.
 */
exports.curryOne = function(func, val, context) {
  if (!func) {
    return null;
  }
  return function() {
    var newArgs = [val], i;
    for (i = arguments.length - 1; i >= 0; i--) {
      newArgs.push(arguments[i]);
    }
    return func.apply(null, newArgs);
  };
};

exports.bindNoArgs = function (func, context) {
  if (!func) {
    return null;
  }
  return function () {
    return func.call(context);
  };
};

/**
 * When the function who's first parameter you are currying accepts only a
 * single argument, and you want to curry it, use this function for performance
 * reasons, as it will never access 'arguments'. It would be an interesting
 * project to detect at static analysis time, calls to F.curry that could be
 * transformed to one of the two optimized versions seen here.
 */
exports.curryOnly = function(func, val, context) {
  if (!func) {
    return null;
  }
  return function() {
    return func.call(context || null, val);
  };
};

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Let's say you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
exports.keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};

/**
 * Input:  {key1: val1, key2: val2}
 * Output: {key1: key1, key2: key2}
 */
exports.keyMirror = function(obj) {
  var key, ret = {};
  if (!obj) {
    return obj;
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

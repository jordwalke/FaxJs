
var cache = {};

/**
 * All that we require for search space is the following form:
 * { keyWords: 'Blah Blah hi',
 *   name: 'Joe Dude',
 *   *** anything else you want ***
 * }
 */
exports.makeSearcher = function(searchSpace) {
  return {
    asyncSearch: function(text, cb) {
      var res = [], searchEntry, i, useAsKeywords;
      if (cache[text]) {
        cb({data: {matches: cache[text], text: text}});
        return;
      }
      for (i=0; i < searchSpace.length; i=i+1) {
        searchEntry = searchSpace[i];
        useAsKeywords = searchEntry.keyWords || searchEntry.name;
        if (!text || (text.length &&
            useAsKeywords.toLowerCase().indexOf(text.toLowerCase()) !== -1)) {
          res.push(searchEntry);
        }
      }
      window.setTimeout(function() {
        cache[text] = res;
        cb({data: {matches: res, text: text}});
      }, 100);
    }
  };
};

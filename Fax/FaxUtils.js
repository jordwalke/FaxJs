
/**
 * FaxUtils: Code that the core Fax code finds useful but not structurally
 * essential.
 */
module.exports = {
  escapeTextNodeForBrowser : function (textNode) {
    return textNode;
  },
  /** Gets the viewport dimensions: #todoreplacewithframework. Likely redundant
   * with whatever framework the client is already including. Including this
   * just as a reference implementation.
   * http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript
   * Will likely cause reflow.
   */
  getViewportDims : function() {
    var viewportwidth, viewportheight;
    /** Better browsers (IE7/mozilla/netscape/opera) use window.innerWidth/innerHeight*/
    if (typeof window.innerWidth !== 'undefined') {
      return {
        viewportWidth : window.innerWidth,
        viewportHeight : window.innerHeight
      };
    } else if (typeof document.documentElement !== 'undefined' &&
      typeof document.documentElement.clientWidth !== 'undefined' &&
      document.documentElement.clientWidth !== 0) {
      /* IE6 in standards compliant mode:
       * should have valid doctype first in document */
      return {
        viewportWidth : document.documentElement.clientWidth,
        viewportHeight : document.documentElement.clientHeight
      };
    } else {
      return {
        viewportWidth : document.getElementsByTagName('body')[0].clientWidth,
        viewportHeight : document.getElementsByTagName('body')[0].clientHeight
      };
    }
  },

  /** Cookie code from quirks mode. */
  createCookie: function(value,days) {
    var expires, name="appCookie";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      expires = "; expires="+date.toGMTString();
    } else {
      expires = "";
    }
    document.cookie = name+"="+JSON.stringify(value)+expires+"; path=/";
    if (this._onCookieChange) {
      this._onCookieChange();
    }
  },
  readCookie: function() {
    var name = "appCookie";
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i=0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return JSON.parse(c.substring(nameEQ.length,c.length));
    }
    return null;
  },
  eraseCookie: function() {
    createCookie("appCookie","",-1);
  },
  _onCookieChange: null
};

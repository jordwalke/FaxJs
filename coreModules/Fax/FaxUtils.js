
function escaper(match) {
  return {"&": "&amp;", ">": "&gt;", "<": "&lt;", "\"": "&quot;", "'": "&#x27;", "/": "&#x2f;" }[match];
}

var browserDetection = null;
/*
 * Thank you quirksmode! (We can delete antique browsers)
 * http://www.quirksmode.org/js/detect.html
 */
function initializeAndReturnBrowserDetection() {
  var BrowserDetect = {
    init: function () {
      this.browser = this.searchString(this.dataBrowser) || "An unknown platform";
      this.version = this.searchVersion(navigator.userAgent) ||
                     this.searchVersion(navigator.appVersion) || "An unknown platform";
      this.OS = this.searchString(this.dataOS) || "An unknown platform";
    },
    searchString: function (data) {
      var i;
      for (i=0;i<data.length;i++) {
        var dataString = data[i].string;
        var dataProp = data[i].prop;
        this.versionSearchString = data[i].versionSearch || data[i].identity;
        if (dataString) {
          if (dataString.indexOf(data[i].subString) !== -1) {
            return data[i].identity;
          }
        }
        else if (dataProp) {
          return data[i].identity;
        }
      }
    },
    searchVersion: function (dataString) {
      var index = dataString.indexOf(this.versionSearchString);
      if (index === -1) {
        return;
      }
      return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },

    /* Taking obscure browsers out of here to reduce gzipped size. You can
     * easily add them back in (see the main quirksmode site for the complete
     * list. */
    dataBrowser: [
      {
        string: navigator.userAgent,
        subString: "Chrome",
        identity: "Chrome"
      },
      { string: navigator.vendor,
        subString: "Apple",
        identity: "Safari",
        versionSearch: "Version"
      },
      { prop: window.opera,
        identity: "Opera",
        versionSearch: "Version"
      },
      { string: navigator.vendor,
        subString: "iCab",
        identity: "iCab"
      },
      { string: navigator.userAgent,
        subString: "Firefox",
        identity: "Firefox"
      },
      { string: navigator.userAgent,
        subString: "MSIE",
        identity: "Explorer",
        versionSearch: "MSIE"
      },
      { string: navigator.userAgent,
        subString: "Gecko",
        identity: "Mozilla",
        versionSearch: "rv"
      }
    ],
    dataOS : [
      {
        string: navigator.platform,
        subString: "Win",
        identity: "Windows"
      },
      {
        string: navigator.platform,
        subString: "Mac",
        identity: "Mac"
      },
      {
        string: navigator.userAgent,
        subString: "iPhone",
        identity: "iPhone/iPod"
      },
      {
        string: navigator.platform,
        subString: "Linux",
        identity: "Linux"
      }
    ]

  };
  BrowserDetect.init();
  return BrowserDetect;
}

/**
 * FaxUtils: Code that the core Fax code finds useful but not structurally
 * essential.
 */
module.exports = {

  browserDetection: function() {
    return browserDetection ? browserDetection : (browserDetection = initializeAndReturnBrowserDetection());
  },

  escapeTextForBrowser : function (textNode) {
    if ((!textNode || !textNode.indexOf) && isNaN(textNode)) {
      throw "Cannot set content to an object";
    }
    return (''+textNode).replace(/[&><"'\/]/g, escaper);
  },

  /** Gets the viewport dimensions: #todoreplacewithframework. Likely redundant
   * with whatever framework the client is already including. Including this
   * just as a reference implementation.
   * http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript
   * Will likely cause reflow.
   */
  getViewportDims : function() {
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
    var expires, name="c";
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
    var name = "c", nameEQ = name + "=", ca = document.cookie.split(';'), i;
    for (i=0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1,c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return JSON.parse(c.substring(nameEQ.length,c.length));
      }
    }
    return null;
  },
  eraseCookie: function() {
    this.createCookie("c","",-1);
  },
  _onCookieChange: null
};



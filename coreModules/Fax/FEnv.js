var FaxUtils = require('./FaxUtils');

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
    var dims = FaxUtils.getViewportDims();
    FEnv.viewportHeight = dims.viewportHeight;
    FEnv.viewportWidth = dims.viewportWidth;
  },
  ensureBrowserDetected: function() {
    FEnv.browserInfo = FaxUtils.browserDetection();
  }
  
};

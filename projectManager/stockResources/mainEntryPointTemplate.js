var F = require('Fax');

/*
 * This file isn't important at all, it's just a point of entry that index.html
 * looks for. It fires up your main module - that is where your application
 * should be build - not here (unless you want to do something special on page
 * load etc.)
 *
 * This function needs to be exported in string form, in case you use Google
 * Closure's advanced minification mode, the key needs to be preserved and not
 * shortened - so that index.html can access it.
 * Don't worry too much about this file - 
 *
 */
exports['indexDotHtmlCallsThisOnLoad'] = function() {

  /*
   * Start building your app at MainModuleName.MainComponent,
   */
  var MainModuleName = require('MainModuleName');
  var start = (new Date()).getTime();
  F.renderTopLevelComponentAt(MainModuleName.MainComponent,
    { mountAtId: 'appMount',
      appStyle: true,
      renderingStrategy: F.renderingStrategies.standard,
      useTransformPositioning: true
    }
  );
  var end = (new Date()).getTime();
  console.log('Total rendering time:' + (end-start));
};

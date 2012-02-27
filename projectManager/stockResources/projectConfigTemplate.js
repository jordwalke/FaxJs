/* By default, all directories in ./lib are copied into the build, but
 * projectModules listed here will be processed by the Fax ast optimizer and
 * will be used to generate stylesheets.
 * To add a new non-UI module:
 *  1. Place in projectDir/lib/
 *  2. Make sure there is a package.json file (if needed) to model depencies,
 *  and set the main file.
 *
 * To add a UI module (Fax component etc.)
 *  1. Place in projectDir/lib
 *  2. Make sure there is a package.json (if needed) (as in non-ui modules).
 *  3. Any module that depends on your new module, needs to declare so in
 *  *their* package.json file (dependencies).
 *  4. add an entry with the same name as that directory in projectModules
 *  (below).
 *  5. Include any css that is generated in index.html.
 */
exports.projectConfig = {
  projectAuthor: "yourEmail@example.com",
  projectUrl: "www.example.com",
  
  /* Only option for now. Simply include your javascript file, but replace .js
   * with .css, and the system will generate a css file for you based on what
   * your javascript module exports as "exports.styleExports". See the default
   * index.html for an example. */
  cssStrategy: 'sameDirAsJs',

  /* For now the index.html in your project root is used. Future iterations will
   * automatically generate your index.html and automatically include style
   * sheets. */
  generateIndexHtml: 'useProjectRootIndexHtml',

  projectMainModule: "main",

  minifyClosureAdvanced: false,

  minifyClosureAdvancedPreserveKeys: {
    thisKeyWillNeverBeMinifiedIfUsingAdvancedMinification: true,
    thisOneWontBeEither: true
  },


  /* Fax Ui modules.
   * To add a new module, add an entry here, and make sure to include it's
   * corresponding css file in index.html (if it has a styleExports).
   * TODO: Have all of these stylesheets automatically injected into the
   * index.html. For now you need to manually include them.
   */
  projectModules: {

    main: { },

    FTheme: { },
    
    FBaseStyle: { },

    FDom: { },

    Fax: { },

    FTextInput: { },

    FBoxes: { },

    FButton: { },

    FToggleSwitch: { },

    MainModuleName: { }
  }
};


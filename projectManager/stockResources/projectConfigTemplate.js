/* Project modules are modules that are owned by your project.  They were
 * "invented *here*". However, they will be usable in other projects. Imagine
 * the name of each of the modules you invent in your projects getting a
 * universal telephone number that is the name of the module. Once you invent a
 * module in your project and build the project, any other project can simply
 * include it as a dependency.  If you make changes to your module in this
 * project, all other projects will automatically see the changes. For all
 * modules that you invent here, this is their home. They belong here.  Modules
 * *not* invented inside your project are a different story.  Note: Even if
 * you're just making a library project, it still needs to have a main module.
 * Allow the main module to be a dummy if needed, or one that renders some
 * information or examples showing yourmodule awesome library.  All of the
 * settings, are assumed to be for the page index.html.  Eventually for
 * multi-page websites (what *are* those?) it would be good to have a way to
 * aggregate multiple projects and map a custom url to each project.  */
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

  projectMainModule: "MainModuleName",

  projectModules: {
    MainModuleName: {                         // Implicit name
      description : "Main module for project ProjectName",
      main        : "./MainModuleName.js"
    },

    FaxUi: {                                 // Implicit name
      description : "FaxUi Toolkit Core",
      main        : "./FaxUi.js"
    },

    Fax: {                                   // Implicit name
      description : "Fax Toolkit Core",
      main        : "./Fax.js"
    }

    /** Add new modules here to have the system automatically package them up in
     * the monolithic build. Todo: when we notice a new module here, with
     * 'autogenerateSkeleton: true' we'll automatically make a new lib directory
     * with skeleton files.  */
  }
};


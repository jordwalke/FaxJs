var util = require('util');
var fs = require('fs');
var scriptDir = __dirname;
var curDir = process.cwd();
var projectName = require('path').basename(curDir);
var exec = require('child_process').exec;



// Forward declarations - we'll unpack dependencies then require them.
var jsParser;
var uglify;

var modulr;
var findIt;

var FaxTailConstructionOptimizer =
    require('./FaxTailConstructionOptimizer');

var FaxStyleGenerator =
    require('./FaxStyleGenerator');



/** Red is 31, off is 0, green is 32 **/
function redStr(str) {
  return "\033[31m" + str + "\033[0m";
}
function greenStr(str) {
  return "\033[32m" + str + "\033[0m";
}

function objMapToArray(obj, mapper) {
  var ret = [], aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey)) {
      ret.push(mapper(obj[aKey], aKey));
    }
  }
  return ret;
}

function getProjectConfigByPath(filePath) {
	var projectConfig = require(filePath).projectConfig || require(filePath);
  if (!projectConfig) {
    console.error("[ERROR]: Can't find project config");
    throw "See error message";
  } else {
    return projectConfig;
  }
}

function logAndThrow(str, e) {
  console.error(redStr('[ERROR]:' + str));
  throw e || str;
}

function logAndThrowIf(b, str, e) {
  if (b) {
    console.error(redStr('[ERROR]:' + str));
    throw e || str;
  }
}

function allDirsInLib(buildSpecs) {
  var i, ret = [];
  var dirContent = fs.readdirSync(buildSpecs.curDir + '/lib/');
  for (i=0; i < dirContent.length; i=i+1) {
    ret.push(buildSpecs.curDir  + '/build/client/buildLib/' + dirContent[i]);
  }
  return ret;
}


console.log("\n------ Build Results ------");
function modulrize(buildSpecs) {
  console.log('-> Building using modulr');
  modulr.build(buildSpecs.projectMainModule, {
    paths: allDirsInLib(buildSpecs),
    root: '/'
  },
  function(one, two) {
    logAndThrowIf(one, one);
    fs.writeFileSync(curDir + '/build/client/monolithicBuild.js', two.output, 'utf8');
    console.log(greenStr("Successfully built and packaged monolithic js!"));
  });
}


function compile(buildSpecs) {
  var i,
      origFileText,
      origFileAst,
      optimizedAst,
      generatedStyleString,
      files = findIt.sync(curDir + '/build/client/buildLib/');


  for (i=0; i < files.length; i=i+1) {
    if (files[i].indexOf('.js') !== files[i].length-3) {
      continue;
    }
    console.log('Attempting optimization of file:' + files[i]);
    try {
      origFileText = fs.readFileSync(files[i], 'utf8');
      origFileAst = jsParser.parse(origFileText);
      optimizedAst = FaxTailConstructionOptimizer.optimizeTailConstructions(origFileAst);
      fs.writeFileSync(files[i], uglify.gen_code(optimizedAst), 'utf8');
    } catch (e) {
      console.error(redStr('[ERROR]: Could not optimize module:' + files[i]));
    }
    try {
      console.log('Generating css file for styleExports from:' + files[i]);
      generatedStyleString = FaxStyleGenerator.generateCss(files[i]);
      if (generatedStyleString) {
        fs.writeFileSync(
            files[i].substr(0, files[i].length - 3) + '.css',
            generatedStyleString, 'utf8');
      }
    } catch (e2) {
      console.error(redStr('[ERROR]: Could not optimize style module:' + files[i] + '/.css'));
      // It seems modulr is throwing better exceptions than this build script for
      // optimization failures, but not style optimization failures. Will rethrow
      // here.
      throw e2;
    }
  }
  modulrize(buildSpecs);
}


function build(buildSpecs) {
  var i, moduleName, moduleDesc, moduleMain, moduleMainPath;

  console.log("-> Creating New Build Directories");
  fs.mkdirSync(curDir + '/build/client', '0777');
  fs.mkdirSync(curDir + '/build/client/staticResources', '0777');
  fs.mkdirSync(curDir + '/build/client/buildLib', '0777');


  console.log('-> Copying project modules to build directory');

  var newPackageFiles = {};
  for (moduleName in buildSpecs.projectConfig.projectModules) {
    if (!buildSpecs.projectConfig.projectModules.hasOwnProperty(moduleName)) {
      continue;
    }
    moduleDesc = buildSpecs.projectConfig.projectModules[moduleName];
    moduleMain = moduleDesc.main;
    logAndThrowIf(moduleMain && (
        moduleMain.length < 6 || moduleMain.substr(0,2) !== './' ||
        moduleMain.substr(moduleMain.length-3) !== '.js'),
        'If a main module is specified (' + moduleMain + ') then it must begin with' +
        '"./" and end with ".js" indicating the file inside of lib/ModuleName');

    logAndThrowIf(buildSpecs.libDirContentsArr.indexOf(moduleName) === -1,
        'Cannot find a directory with module name ' + moduleName + ' in lib -' +
        'Why is it specified as a project module in ProjectConfig.js?');

    moduleMainPath = buildSpecs.buildClientBuildLibDir + moduleName + '/' +(
         moduleMain ? moduleMain.substr(2) : (moduleName + '.js'));
    console.log('   -> Using single module main file in build:' + moduleMainPath);

  }
  

  /* Todo: build skeletons for missing modules. */
  /* Here, we sym link node_modules to the buildLib because things we require
   * (that have style modules that we want to turn into css) have dependencies
   * on the other project modules. We need to make sure that their dependencies
   * are met. */
  exec("cp -r " + curDir + "/lib/* " + curDir + "/build/client/buildLib/; " +
       "ln -s " + curDir + "/build/client/buildLib " + curDir + "/build/client/node_modules; " +
       "cp " + curDir + "/index.html " + curDir + "/build/client/ ;" +
       "cp -r " + curDir + "/staticResources/* " + curDir + "/build/client/staticResources/ ;",

    function (error, stdout, stderr) {
      util.debug(stdout);
      util.debug(stderr);
      logAndThrowIf(error, 'Error moving lib to buildLib');

      compile(buildSpecs);
    });
}

function setup() {
  var i, req, projectConfigText;
  try {
    projectConfigText = fs.readFileSync(curDir + '/ProjectConfig.js', 'utf8');
  } catch (e) {
    logAndThrow("[ERROR]: No Project Config Found!", e);
  }

  var curDirContents = fs.readdirSync(curDir);

  var CHECK_PREBUILD = {
    'build': false,
    'lib': false,
    'index.html': false,
    'server.js': true,
    'staticResources': false,
    'ProjectConfig.js': false,
    'build/buildRequirements': false,
    'build/buildReqquirements/buildPrereqsNodeModules.zip': false
  };

  var BUILD_REQUIREMENTS = {
    'lib': true,
    'index.html': true,
    'server.js': true,
    'missingRequirements': true,
    'ProjectConfig.js': true
  };

  var buildReqs = {};

  var missingRequirements = [];


  for (req in CHECK_PREBUILD) {
    if (!CHECK_PREBUILD.hasOwnProperty(req)) {
      continue;
    }
    CHECK_PREBUILD[req] = curDirContents.indexOf(req) !== -1;
    if (BUILD_REQUIREMENTS[req] && !CHECK_PREBUILD[req]) {
      missingRequirements.push(req);
    }
  }

  logAndThrowIf(missingRequirements.length,
        "Missing Build Requirements:" +
        JSON.stringify(missingRequirements) + "\n" +
        "Observe project root to have: " +
        JSON.stringify(curDirContents));

  var projectConfig = getProjectConfigByPath(curDir + '/ProjectConfig.js');
  var projectMainModule = projectConfig.projectMainModule;
  var libDirContentsArr = fs.readdirSync(curDir + '/lib');
  var buildClientBuildLibDir = curDir + '/build/client/buildLib/'; 
  var curTime = (new Date()).getTime();
  logAndThrowIf(!projectMainModule, 'NO Main Module Name!');


  var buildSpecs = {
    libDirContentsArr: libDirContentsArr,
    projectConfig: projectConfig,
    curDir: curDir,
    projectMainModule: projectMainModule,
    buildClientBuildLibDir: buildClientBuildLibDir
  };

  /* Remove build directory. Point of no return!*/
  console.log('-> Removing Old Build Directory (Backing up)');

  if (CHECK_PREBUILD.build) {
    try {
      exec(
        'mv ' + curDir + '/build/client ' + curDir + '/build/buildBackups/b' + curTime + ' ;',
        function (error, stdout, stderr) {
          util.debug(stdout);
          util.debug(stderr);
          logAndThrowIf(error, 'Error moving Build directory', error);
          build(buildSpecs);
        }
      );
    } catch (e1) {
      logAndThrow('Could Not Issue Exec For Clean Build Directory!', e1);
    }
  } else {
    build(buildSpecs);
  }
}


exec(
  'cd ' + curDir + '/build/buildRequirements/; rm -r ./node_modules/; unzip buildPrereqsNodeModules.zip; cd ' + curDir + ';',
  function (error, stdout, stderr) {
    util.debug(stdout);
    util.debug(stderr);
    logAndThrowIf(error, 'Error Unpacking build prereqs', error);

    jsParser = require('uglify-js').parser;
    uglify = require('uglify-js').uglify;
    modulr = require('modulr');
    findIt = require('findit');

    setup();
  }
);

/*projectRoot
|
+- staticResources (optional)
|
+- runBuild.sh
|
+- server.js
|
+- simpleClientFileServer.sh 
|
+- ProjectConfig.js
|
+- index.html (optional - will be used if present)
|
+- lib
|  |
|  +- YourModule
|  |
|  +- YourOtherModule
|
+- build   (All of the above is packaged into the build directory, which is a self-contained, portable directory.)
           (You would likely take the result and integrate it into your system, but a simple client file server
            is given just to test serving from a web server. You can also usually just open index.html in any browser without
            running any server.)
  +- server
  |  |
  |  +- simpleClientFileServer.js
  |
  +- client
  |  |
  |  +- index.html
  |  |
  |  +- staticResources
  |  |
  |  +- monolithicBuild.js (process all files -> browserify.js -> closure = monolithicBuild.js)
  |  |
  |  +- monolithicStyle.css (simple concatenation of all optimized css files - optional to use)
  |  |
  |  +- lib
  |     |
  |     +- YourModule
  |     |  |
  |     |  +- YourModule.js (even if we use monolithic)
  |     |  |
  |     |  +- YourModule.css (if applicable)
  |     |  |
  |     |  +- otherContentsInOriginalModuleDir (such as images etc.)
  |     |
  |     +- YourOtherModule
*/

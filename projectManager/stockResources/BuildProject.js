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
/**
 * We first build the monolithicBuild.js without closure. Then we potentially
 * perform advanced minification using closure. If so, that in itself is a two
 * step process:
 * monolithicBuild.js =>
 *    monolithicBuildNotCssAppropriate.js(first pass output)
 *    monolithicBuildCssAppropriate.js(second pass output)
 */
var BASE_CLOSURE_COMMAND = 'java -jar ' + curDir + '/build/buildRequirements/closure_compiler/compiler.jar ';

var INITIAL_CLOSURE_COMMAND = BASE_CLOSURE_COMMAND +
 '--js ' + curDir + '/build/client/monolithicBuild.js ' +
 '--property_map_output_file ' + curDir + '/build/artifacts/keyRenameMapNotCssAppropriate.txt ' +
 '--compilation_level ADVANCED_OPTIMIZATIONS ' +
 // Temporary intermediate file - not yet appropriate for use with minified css.
 // Only used to generate potential key renaming map for correction.
 '--js_output_file ' + curDir + '/build/artifacts/monolithicBuildNotCssAppropriate.js ';

/**
 * Recompile a second time, after we use the output of the first to detect when
 * keys would collide if used in css minification. We resolve those collissions
 * here and recompile a second time with those resolutions enhancing the
 * process.
 */
var CLOSURE_COMMAND_CSS_APPROPRIATE = BASE_CLOSURE_COMMAND +
 '--js ' + curDir + '/build/client/monolithicBuild.js ' +
 '--property_map_input_file ' + curDir + '/build/artifacts/keyRenameMapCssAppropriate.txt ' +
 '--compilation_level ADVANCED_OPTIMIZATIONS ' +
 '--js_output_file ' + curDir + '/build/artifacts/monolithicBuildPostCorrectedClosure.js; ' +
 'mv ' + curDir + '/build/artifacts/monolithicBuildPostCorrectedClosure.js ' + curDir +
        '/build/client/monolithicBuild.js';

var FaxTailConstructionOptimizer = require('./FaxTailConstructionOptimizer');
var FaxStyleGenerator = require('./FaxStyleGenerator');
var FaxStyleExportsRemover = require('./FaxStyleExportsRemover');

function replaceAll(text, search, replace) {
  if (search === replace) {
    return text;
  }
  while(text.indexOf(search) !== -1) {
    text = text.replace(search, replace);
  }
  return text;
}

function execAndStream(commandStr, callback) {
  util.debug('Executing:' + commandStr);
  exec(commandStr, function (error, stdout, stderr) {
      util.debug(stdout);
      util.debug(stderr);
      callback(error);
  });
}

var DEDUPE_KEYS = [
];

var CONSUMED_DEDUPE_KEYS = 0;
var CHARS = "abcdefghijklmnopqrstuvwxyz";
var CHARS_NUMS = '0123456789abcdefghijklmnopqrstuvwxyz';
var TOTAL_DEDUPE_COMBS = CHARS.length*CHARS_NUMS.length;
for (var i = 0; i < CHARS.length; i++) {
  DEDUPE_KEYS.push(CHARS[i]);
  for (var j = 0; j < CHARS_NUMS.length; j++) {
    DEDUPE_KEYS.push(CHARS[i]+CHARS_NUMS[j]);
  }
}

function nextDedupedKeyNotIn(map) {
  do {
    CONSUMED_DEDUPE_KEYS++;
  } while(CONSUMED_DEDUPE_KEYS < TOTAL_DEDUPE_COMBS && map[DEDUPE_KEYS[CONSUMED_DEDUPE_KEYS]]);
  return DEDUPE_KEYS[CONSUMED_DEDUPE_KEYS];
}

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

console.log("\n------ Build Results ------");
function modulrize(buildSpecs, callback) {
  console.log('-> Building using modulr');
  var paths = objMapToArray(
      buildSpecs.projectConfig.projectModules,
      function(moduleDesc, projectModuleName) {
        return buildSpecs.buildClientBuildLibDir + projectModuleName;
      }
    );
  modulr.build(buildSpecs.projectMainModule, {
    paths:paths ,
    root: '/'
  },
  function(one, two) {
    logAndThrowIf(one, one);
    fs.writeFileSync(curDir + '/build/client/monolithicBuild.js',
        fixModuleOutputForAdvancedCompilation(two.output), 'utf8');
    callback();
    console.log(greenStr("Successfully built and packaged non-closure-optimized js"));
  });
}

function fixModuleOutputForAdvancedCompilation(output) {
  return output.replace("exports.define", "exports['define']").
         replace("exports.require", "exports['require']");
}

function cssNameForJsFileNamePath (fileNamePath) {
  return fileNamePath.substr(0, fileNamePath.length - 3) + '.css';
}

function isJsFileNamePath (fileNamePath) {
  return fileNamePath.indexOf('.js') === fileNamePath.length-3;
}

function outputCss(styleSheetsByPath, transformer) {
  var monolithicStyle = '';
  util.debug(greenStr('Outputting generated css'));
  for (var filePath in styleSheetsByPath) {
    if(styleSheetsByPath.hasOwnProperty(filePath)) {
      var lastStepProcessedStyleSheet = transformer(styleSheetsByPath[filePath]);
      monolithicStyle += lastStepProcessedStyleSheet;
      fs.writeFileSync(filePath, lastStepProcessedStyleSheet, 'utf8');
    }
  }
  fs.writeFileSync(curDir + '/build/client/monolithicStyle.css', monolithicStyle, 'utf8');
  util.debug(greenStr('Done outputing css and monolithic css'));
}

function compile(buildSpecs) {
  var i, origFileText, origFileAst, optimizedAst, generatedStyleString,
      buildLibFiles = findIt.sync(curDir + '/build/client/buildLib/'),
      /* We have to save the style sheets for later, because we don't yet know if we're going
       * to advanced minify - if so we need to hold off on the writing out of files. */
      styleSheetsForLaterByPath = {},
      files = [];


  /**
   * The ProjectConfig is the way that ordering of styles is defined for now. It
   * should probably be in dependency order - but this works okay for now.
   * So we build up the files array based on the module order. Repeat: files has
   * files from buildLib in order of modules listed in ProjectConfig.js
   * Once modular allows hooks for build processing, it will be in dependency
   * order.
   */
  for (var moduleName in buildSpecs.projectConfig.projectModules) {
    util.debug(moduleName);
    for (i=0; i < buildLibFiles.length; i=i+1) {
      if(buildLibFiles[i].indexOf(curDir + '/build/client/buildLib//' + moduleName+'/') === 0) {
        files.push(buildLibFiles[i]);
      }
    }
  }

  function doComile() {
    for (i=0; i < files.length; i=i+1) {
      if (!isJsFileNamePath(files[i])) {
        continue;
      }
      try {
        origFileText = fs.readFileSync(files[i], 'utf8');
        origFileAst = jsParser.parse(origFileText);
        optimizedAst = FaxTailConstructionOptimizer.optimizeTailConstructions(origFileAst);
        try {
          fs.writeFileSync(files[i], uglify.gen_code(optimizedAst), 'utf8');
          generatedStyleString = FaxStyleGenerator.generateCss(files[i]);
          if (generatedStyleString) {
            styleSheetsForLaterByPath[cssNameForJsFileNamePath(files[i])] = generatedStyleString;
          }
        } catch (e2) {
          console.error(redStr('[ERROR]: Could not optimize style module:' + files[i] + '/.css'));
          throw e2;
        }
        optimizedAstWithStyleExportsRemoved = FaxStyleExportsRemover.removeStyleExports(optimizedAst);
        fs.writeFileSync(files[i], uglify.gen_code(optimizedAstWithStyleExportsRemoved), 'utf8');
      } catch (e) {
        console.error(redStr('[ERROR]: Could not optimize module:' + files[i]));
        throw e;
      }
    }
    modulrize(buildSpecs, potentiallyMinifyAndGenerateStyleSheets);
  }
  doComile(buildSpecs);

  function potentiallyMinifyAndGenerateStyleSheets() {
    if (!buildSpecs.minifyClosureAdvanced) {
      outputCss(styleSheetsForLaterByPath, function(s) {return s;});
    } else {
      // As a last step, we process the stylesheets, minifying them. We could have just minified
      // everything, then called styleExports, but this way allows us to rip style exports out of
      // the minification process which could polute closure's choice of tiny keys (1char).
      // This way, we first run closure, get the remap file, then use that to shorten up the css.
      // Although, we could do it in a more elegant way here - by rerunning closure on each js
      // file, then yanking out the styleExports - but that would be very very slow. This is just
      // string replacement. Store the rename maps by length so that we can easily replace them
      // in css without having problems where class names are prefixes of other class names -
      // we start at the shortest class names and work our way to the longer
      // ones so that we don't "reclobber" something that was just renamed.
      buildAdvancedRenameKeysForAppropriateCssUsage(buildSpecs, function(cssAppropriateKeyRenameMap) {
        var subsetByOriginalSymbLength = orderKeyRenameMapByOriginalSymbolLength(cssAppropriateKeyRenameMap);
        var styleSheetTransformer = function(styleSheet) {
          for (var keyLen = 0; keyLen < subsetByOriginalSymbLength.length; keyLen++) {
            var renameMap = subsetByOriginalSymbLength[keyLen];
            for (var symbol in renameMap) {
              styleSheet = replaceAll(styleSheet, '.'+symbol + ' ', '.'+renameMap[symbol] + ' ');
              styleSheet = replaceAll(styleSheet, '.'+symbol + ':', '.'+renameMap[symbol] + ':');
            }
          }
          return styleSheet;
        };
        outputCss(styleSheetsForLaterByPath, styleSheetTransformer);
      });
    }
  }
}

/**
 * Builds with closure, dedupes keys to tolerate css symbol case insensitivity, returns
 * the new key rename map that will not have any two symbols renamed to identical symbols
 * congruent modulo lowerCase.
 * Before: {dog: 'aa', cat: 'aA'} After: {dog: 'aa', cat: 'D1'}
 * Todo: rename any symbols that got leading dollar signs.
 * Todo: first search css output for any occurance before applying any of these rules.
 */
function buildAdvancedRenameKeysForAppropriateCssUsage(buildSpecs, callback) {
  util.debug(greenStr('Building advanced Closure Compilation - going to make css conform to key remapping'));
  buildWithAdvancedClosure(false, function () {
    var keyRenameMap = getMostRecentKeyRenameMapFromFile();
    var cssAppropriateKeyRenameMap = dedupeCssAppropriate(keyRenameMap);
    writeOutKeyRenameMapForNextClosureCompile(buildSpecs, cssAppropriateKeyRenameMap);
    /* Have to build a second time, this time clobering that rename file. */
    buildWithAdvancedClosure(true, function() {
      callback(cssAppropriateKeyRenameMap);
    });
  });
}

function writeOutKeyRenameMapForNextClosureCompile(buildSpecs, keyRenameMap) {
  var fileStr = '';
  var minifyClosureAdvancedPreserveKeys = buildSpecs.minifyClosureAdvancedPreserveKeys;
  for (var origSymbol in keyRenameMap) {
    if(!keyRenameMap.hasOwnProperty(origSymbol)) {
      continue;
    }
    if (!minifyClosureAdvancedPreserveKeys[origSymbol]) {
      fileStr+=(origSymbol + ':' + keyRenameMap[origSymbol] + '\n');
    } else {
      fileStr+=(origSymbol + ':' + origSymbol + '\n');
    }
  }
  fs.writeFileSync(
    curDir +  '/build/artifacts/keyRenameMapCssAppropriate.txt',
    fileStr,
    'utf8');
}

/* Builds advanced, dedupes keys (in case INsensitive manner), passes deduped
 * rename map and same map ordered by original key length. */
function buildWithAdvancedClosure(cssAppropriate, callback) {
  util.debug(greenStr('Attempting Google Closure Advanced Minification'));
  execAndStream(cssAppropriate ? CLOSURE_COMMAND_CSS_APPROPRIATE : INITIAL_CLOSURE_COMMAND, function (error) {
    logAndThrowIf(error, 'Error performing Closure Advanced Minification');
    callback();
  });
}

function orderKeyRenameMapByOriginalSymbolLength(keyRenameMap) {
  var subsetByOriginalSymbLength = [];
  for (var originalSymbol in keyRenameMap) {
    if(keyRenameMap.hasOwnProperty(originalSymbol)) {
      if (!subsetByOriginalSymbLength[originalSymbol.length]) {
        subsetByOriginalSymbLength[originalSymbol.length] = {};
      }
      subsetByOriginalSymbLength[originalSymbol.length][originalSymbol] =
          keyRenameMap[originalSymbol];
    }
  }
  return subsetByOriginalSymbLength;
}

/**
 * Gets rid of duplicates with respect to case insensitivity, and keys that are
 * not valid symbols across javascript and css files.
 * { aa => {dog:aa, cat:aA}}
 */
function dedupeCssAppropriate(keyRenameMap) {
  var lowerCaseKeyToEntries = {};
  var newRenameMap = {};
  for (var symbol in keyRenameMap) {
    if(keyRenameMap.hasOwnProperty(symbol)) {
      var renamedTo = keyRenameMap[symbol];
      var lowerCaseRenamedTo = renamedTo.toLowerCase();
      if (!lowerCaseKeyToEntries[lowerCaseRenamedTo]) {
        lowerCaseKeyToEntries[lowerCaseRenamedTo] = {};
      }
      lowerCaseKeyToEntries[lowerCaseRenamedTo][symbol] = renamedTo;
    }
  }

  for (var lowerCaseKey in lowerCaseKeyToEntries) {
    if(lowerCaseKeyToEntries.hasOwnProperty(lowerCaseKey)) {
      var entries = lowerCaseKeyToEntries[lowerCaseKey];
      /* If there's dups w.r.t. lowerCase, or a dollar sign.  Todo, let the
       * first occurance keep the mixed case, non-dollar sign */
      if (Object.keys(entries).length > 1 || lowerCaseKey.indexOf('$') !== -1) {
        var first = true;
        for(var originalSymbol in entries) {
          if(!entries.hasOwnProperty(originalSymbol)) {
            continue;
          }
          if (!first || lowerCaseKey.indexOf('$') !== -1) {
            newRenameMap[originalSymbol] = nextDedupedKeyNotIn(lowerCaseKeyToEntries);
          } else {
            newRenameMap[originalSymbol] = lowerCaseKey;
          }
          first = false;
        }
      } else {
        for(var originalSymbol in entries) {
          if(entries.hasOwnProperty(originalSymbol)) {
            newRenameMap[originalSymbol] = entries[originalSymbol];
          }
        }
      }
    }
  }
  return newRenameMap;
}

function getMostRecentKeyRenameMapFromFile() {
  var keyRenameMapFileText = fs.readFileSync(
      curDir + '/build/artifacts/keyRenameMapNotCssAppropriate.txt', 'utf8');
  var keyRenameLines = keyRenameMapFileText.split('\n');
  var keyRenameMap = {};
  for (var i = keyRenameLines.length - 1; i >= 0; i--) {
    var split = keyRenameLines[i].split(':');
    if (split[0] && split[1]) {
      keyRenameMap[split[0]] = split[1];
    }
  }
  return keyRenameMap;
}

function build(buildSpecs) {
  var i, moduleName, moduleDesc, moduleMain, moduleMainPath;

  console.log("-> Creating New Build Directories");
  fs.mkdirSync(curDir + '/build/client', '0777');
  fs.mkdirSync(curDir + '/build/client/staticResources', '0777');
  fs.mkdirSync(curDir + '/build/client/buildLib', '0777');


  console.log('-> Copying project modules to build directory');

  for (moduleName in buildSpecs.projectConfig.projectModules) {
    if (buildSpecs.projectConfig.projectModules.hasOwnProperty(moduleName)) {
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
  }

  /* Todo: build skeletons for missing modules. */
  /* Here, we sym link node_modules to the buildLib because things we require
   * (that have style modules that we want to turn into css) have dependencies
   * on the other project modules. We need to make sure that their dependencies
   * are met. */
  execAndStream("cp -r " + curDir + "/lib/* " + curDir + "/build/client/buildLib/; " +
       "ln -s " + curDir + "/build/client/buildLib " + curDir + "/build/client/node_modules; " +
       "cp " + curDir + "/index.html " + curDir + "/build/client/ ;" +
       "cp -r " + curDir + "/staticResources/* " + curDir + "/build/client/staticResources/ ;",

    function (error) {
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
  var curBuildDirContents = fs.readdirSync(curDir + '/build');

  var CHECK_PREBUILD = {
    'build': false,
    'lib': false,
    'index.html': false,
    'server.js': true,
    'staticResources': false,
    'ProjectConfig.js': false,
    'build/buildRequirements': false,
    'build/buildRequirements/buildPrereqsAndNodeModules.zip': false
  };
  var CHECK_PREBUILD_IN_BUILD = {
    'client': false,
    'artifacts': false,
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


  util.debug(JSON.stringify(curDirContents));
  for (req in CHECK_PREBUILD) {
    if (CHECK_PREBUILD.hasOwnProperty(req)) {
      CHECK_PREBUILD[req] = curDirContents.indexOf(req) !== -1;
      if (BUILD_REQUIREMENTS[req] && !CHECK_PREBUILD[req]) {
        missingRequirements.push(req);
      }
    }
  }
  for (req in CHECK_PREBUILD_IN_BUILD) {
    if (CHECK_PREBUILD_IN_BUILD.hasOwnProperty(req)) {
      CHECK_PREBUILD_IN_BUILD[req] = curBuildDirContents.indexOf(req) !== -1;
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
    buildClientBuildLibDir: buildClientBuildLibDir,
    minifyClosureAdvanced: projectConfig.minifyClosureAdvanced,
    minifyClosureAdvancedPreserveKeys: projectConfig.minifyClosureAdvancedPreserveKeys
  };


  /* Lazily create the artifacts directory. */
  if (!CHECK_PREBUILD_IN_BUILD['artifacts']) {
    fs.mkdirSync(curDir + '/build/artifacts', '0777');
  }
  /* Remove build client directory. */
  console.log('-> Removing Old Build client Directory (Backing up)');
  if (CHECK_PREBUILD_IN_BUILD['client']) {
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
  'rm -r ' + curDir + '/build/buildRequirements/node_modules/; rm -r ' + curDir + '/build/buildRequirements/closure_compiler/; ' +
   ' cd ' + curDir + '/build/buildRequirements; unzip buildPrereqsAndNodeModules.zip; cd ' + curDir + ';',
  function (error, stdout, stderr) {
    util.debug(stdout);
    util.debug(stderr);
    logAndThrowIf(error, 'Error Unpacking build prereqs', error);
    util.debug('Unpacked resources');

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

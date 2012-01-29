var sys = require('sys');
var fs = require('fs');
var scriptDir = __dirname;
var curDir = process.cwd();
var projectName = require('path').basename(curDir);
var mainModuleName = projectName;
var exec = require('child_process').exec;
var i;

function projectConfig(fileName) {
	return require(fileName).projectConfig || require(fileName);
}

// Code duplicated
function replaceAll(text, search, replace) {
  if (search === replace) {
    return text;
  }
  while(text.indexOf(search) !== -1) {
    text = text.replace(search, replace);
  }
  return text;
}


var defaultIndexHtml =
  fs.readFileSync(scriptDir + '/stockResources/defaultIndexHtml.html', 'utf8').
      replace('pageTitle', projectName).
      replace('{insertStyleRequiresHere}', '');
  // This style will be kept in sync with all modules that are monolithic js,
  // that also export styleExports

var defaultMainModule = replaceAll(
  replaceAll(
    fs.readFileSync(scriptDir + '/stockResources/mainModuleTemplate.js', 'utf8')
  ),
  'ProjectName', projectName
);

var defaultProjectConfig =
  replaceAll(
    replaceAll(fs.readFileSync(scriptDir + '/stockResources/projectConfigTemplate.js', 'utf8'),
    'MainModuleName', mainModuleName
  ),
  'ProjectName', projectName
);

var defaultModulePackageJson = replaceAll(
  fs.readFileSync(scriptDir + '/stockResources/mainModulePackageTemplate.json', 'utf8'),
  'MainModuleName', mainModuleName
);

var defaultEntryPointPackageJson = replaceAll(
  fs.readFileSync(scriptDir + '/stockResources/mainEntryPointPackageTemplate.json', 'utf8'),
  'MainModuleName', mainModuleName
);

var defaultEntryPointModule = replaceAll(
  fs.readFileSync(scriptDir + '/stockResources/mainEntryPointTemplate.js', 'utf8'),
  'MainModuleName', mainModuleName
);


var EVIDENCE_OF_PRIOR_PROJECT = {
  'build.sh': true,
  'server.js': true,
  'build/buildRequirements': true,
  'staticResources': true,
  /* We allow an index */
  'ProjectConfig.js': true,
  'lib': true,
  'build': true
};

var curDirContents = fs.readdirSync(curDir);
for (i=0; i < curDirContents.length; i=i+1) {
  if (EVIDENCE_OF_PRIOR_PROJECT[curDirContents[i]]) {
    throw "\n[ERROR]: The file '" + curDirContents[i] + "' indicates this is " +
    " already a project. Create a new directory named after your project " +
    " (for example mkdir MyProject; node /path/to/FaxCreateProjectHere.js;)\n";
  }
}

if (curDirContents.length) {
  throw "There are files in this directory. Create a new directory named after your " +
         "project (camel case starting with cap) then rerun this script.";
}

fs.mkdirSync(curDir + '/staticResources/', '0777');
fs.mkdirSync(curDir + '/lib', '0777');
fs.mkdirSync(curDir + '/lib/' + mainModuleName, '0777');
fs.mkdirSync(curDir + '/build', '0777');
fs.mkdirSync(curDir + '/build/buildBackups', '0777');
fs.mkdirSync(curDir + '/build/buildRequirements', '0777');
fs.mkdirSync(curDir + '/build/client', '0777');
fs.mkdirSync(curDir + '/build/client/staticResources', '0777');
fs.mkdirSync(curDir + '/build/client/builtLib', '0777');
fs.writeFileSync(curDir + '/index.html', defaultIndexHtml, 'utf8');
fs.writeFileSync(curDir + '/ProjectConfig.js', defaultProjectConfig, 'utf8');
fs.writeFileSync(curDir + '/lib/' + mainModuleName + '/package.json', defaultModulePackageJson, 'utf8');
fs.mkdirSync(curDir + '/lib/main', '0777');
fs.writeFileSync(curDir + '/lib/main/package.json', defaultEntryPointPackageJson, 'utf8');
fs.writeFileSync(curDir + '/lib/main/main.js', defaultEntryPointModule, 'utf8');
fs.writeFileSync(curDir + '/lib/' + mainModuleName + '/' +
                 mainModuleName + '.js', defaultMainModule, 'utf8');

/**
 * Only case in which the build system gives Fax any sort of special treatment.
 * when creating a new "project", drop in the Fax libs in to the lib directory.
 * Other than that, this is really a pure commonjs/modulr based project
 * manager agnostic to framework.
 */
var copyCommand =
  "cp -r {scriptDir}/stockResources/staticResources/* {curDir}/staticResources/; " +
  "cp -r {scriptDir}/stockResources/defaultWebServer.js {curDir}/server.js;" +
  "cp -r {scriptDir}/stockResources/runBuild.sh {curDir}/runBuild.sh;" +
  "cp -r {scriptDir}/stockResources/newProjectDotGitIgnore {curDir}/.gitignore;" +
  "cp -r {scriptDir}/stockResources/buildPrereqsAndNodeModules.zip {curDir}/build/buildRequirements/buildPrereqsAndNodeModules.zip;" +
  "cp -r {scriptDir}/../astTransformations/* {curDir}/build/buildRequirements/;" +
  "cp -r {scriptDir}/stockResources/BuildProject.js {curDir}/build/buildRequirements/BuildProject.js;" +
  "cp -r {scriptDir}/stockResources/BuildAndRun.js {curDir}/build/buildRequirements/BuildAndRun.js;" +
  "cp -r {scriptDir}/../coreModules/* {curDir}/lib/;";

exec(copyCommand.replace(/\{scriptDir\}/g, scriptDir).
                 replace(/\{curDir\}/g, curDir),
  function (error, stdout, stderr) {
    sys.puts(stdout);
    if (error) {
      console.error("Project failed copying over new project files");
      throw error;
    }
    console.log('\nDone Creating Project. Checkout index.html, and ProjectConfig.js\n' +
                'Execute ./runBuild.sh then visit http://localhost:8080/\n');
  }
);

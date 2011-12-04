var sys = require('sys');
var fs = require('fs');
var scriptDir = __dirname;
var curDir = process.cwd();
var projectName = require('path').basename(curDir);
var exec = require('child_process').exec;
var fork = require('child_process').fork;

var webServerProc = null;


/** Red is 31, off is 0, green is 32 **/
function redStr(str) {
  return "\033[31m" + str + "\033[0m";
}
function greenStr(str) {
  return "\033[32m" + str + "\033[0m";
}



var buildIsRequested = false;
var filesMap = {};
function addFilesToMap(files) {
  var i;
  for (i=0; i < files.length; i=i+1) {
    filesMap[files[i]] = true;
  }
}


function buildProject(whenDone) {
  console.log('--- Building Project ---');
  exec("node " + scriptDir + "/BuildProject.js; ", 
    function (error, stdout, stderr) {
      console.log('--- Building Process Returned ---');
      console.error(stdout);
      console.error(stderr);
      if (error) {
        console.error('\n' +
          redStr("[ERROR] Something is blocking the build - fix it or the server can't update.\n"));
      } else {
        if (whenDone) {
          whenDone();
        }
      }
    }
  );
}

/**
 * Starts the web server, looking for the server in the project root for a
 * file called server.js
 */
function startServer(whenDone) {
  console.log(greenStr('\nRunning Server:' + curDir + "/server.js\n"));
  webServerProc = fork(curDir + "/server.js"); 
  webServerProc.on('exit', function (code, signal) {
    console.log('Web Server Killed due to signal ' + signal);
    // When we get word that our web server is dead, terminate our
    // own process.
    process.kill('SIGHUP');
  });

  // When someone presses Ctrl-c, send SIGHUP to child process
  process.on('SIGINT', function () {
    webServerProc.kill('SIGHUP');
  });
  process.on('SIGHUP', function () {
    webServerProc.kill('SIGHUP');
  });
}

console.log('--- Performing initial build on project ---');
/* The build project step will unzip node_modules prereqs that contain
 * findit.js. We need to wait until the build returns in order to require
 * findit. Not very well structured but it prevents having to unzip
 * in BuildAndRun *and* BuildProject.js */
buildProject(function() {
  var fileName;
  console.log('--- Starting Web Server ---');
  startServer();
  console.log('--- Watching directory for changes ---');
  setInterval(function() {
    if (buildIsRequested) {
      buildIsRequested = false;
      buildProject(null);
    }
  }, 50);  // Debounce a bit

  var findIt = require('findit');
  addFilesToMap([curDir + '/ProjectConfig.js', curDir + '/index.html']);
  addFilesToMap(findIt.sync(curDir + '/lib'));
  addFilesToMap(findIt.sync(curDir + '/staticResources'));

  for (fileName in filesMap) {
    if (!filesMap.hasOwnProperty(fileName)) {
      continue;
    }
    fs.watchFile(fileName, {}, function(cur, prev) {
      if (cur.mtime > prev.mtime) {
        buildIsRequested = true;
      }
    });
  }
});

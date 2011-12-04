
console.log("\nServing files from client build directory");
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

console.log('Web server mounted at:' + __dirname + '/build/client/');
http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname,
      fileName = path.join(__dirname + '/build/client/', uri);
  
  console.log('  <- requesting file name:' + fileName);
  path.exists(fileName, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("Fail Sauce: 404\n");
      response.end();
      return;
    }

	  if (fs.statSync(fileName).isDirectory()) fileName += '/index.html';
    fs.readFile(fileName, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(8080);

console.log("Static file server running on port 8080 - CTRL + C to stop");

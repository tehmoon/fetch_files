var request  = require("request");
var optimist = require("optimist");
var fs       = require("fs");
var path     = require("path");
var jsdom    = require("jsdom");
var colors   = require("colors");


function parseArgs(cb) {
  var usage  = optimist.usage("Usage: $0 -d 'directory of destination' -u 'url to fetch' [-c 'custom name inside the -d directory']");
  var demand = usage.demand(["u","d"]);
  var argv   = demand.argv;
  var opts   = {};
  var err    = null;

  opts.url     = argv.u;
  opts.destDir = argv.d;
  opts.custDir = argv.c;


  if((typeof(opts.url) !== "string") || (typeof(opts.destDir) !== "string")) err = new Error("One arg is not a string");
  if(opts.custDir) {
    if(typeof(opts.custDir) !== "string") err = new Error("One arg is not a string");
  }

  if(err) {
    if(typeof(cb) !== "function") return false;
    return cb(err);
  } else {
    if(typeof(cb) !== "function") return opts;
    return cb(err, opts);
  }
}

function verifyAndCreatePath(opts, cb) {
  if(typeof(opts) !== "object") throw(new Error("First arg is not an object."));
  if(typeof(opts.destDir) !== "string") throw(new Error("destDir of first arg is not a string."));
  if(typeof(cb) !== "function") throw(new Error("Callback is mandatory."));
  var relativePath = path.relative(process.cwd(), opts.destDir);
  var objDate      = new Date();
  var date         = objDate.getFullYear() +
                     (objDate.getMonth() < 10 ? "0" +  objDate.getMonth(): objDate.getMonth()) +
                     (objDate.getDate() < 10 ? "0" +  objDate.getDate(): objDate.getDate()) + "-" +
                     (objDate.getHours() < 10 ? "0" +  objDate.getHours(): objDate.getHours()) + ":" +
                     (objDate.getMinutes() < 10 ? "0" +  objDate.getMinutes(): objDate.getMinutes()) + ":" +
                     (objDate.getSeconds() < 10 ? "0" +  objDate.getSeconds(): objDate.getSeconds());
  var custDir      = opts.custDir || date;

  //if relativePath is empty it means that the user entered
  //opt path to "."
  if(relativePath === "") relativePath = ".";

  //relativePath = path.join(relativePath, custDir);

  function canCreateDir(relativePath, cb) {
    if(typeof(cb) !== "function") throw(new Error("Callback is mandatory."));

    fs.stat(relativePath, function(err, stats) {
      if(err) {
        switch(err.code) {
          case "ENOENT":
            //we return here because it means that we can create the directory
            return cb(null, relativePath);
            break;
          case "EACCES":
            return cb(new Error("Cannot access directory: " + destDir));
            break;
          default:
            return cb(err);
            break;
        }
      }

      //it means that the path already exists,
      //so send back false to notify that you dont
      //need to create a new dir, but also send back
      //the path
      return cb(false, relativePath);
    });
  }

  function createDir(relativePath, cb) {
    if(typeof(cb) !== "function") throw(new Error("Callback is mandatory."));

    //TODO: opts chown ???
    fs.mkdir(relativePath, 0770, function(err) {
      if(err) return cb(err);

      return cb(null, relativePath);
    });
  }

  //we first stat the relativePath to make sure nothing is wrong with it
  fs.stat(relativePath, function(err, stats) {
    if(err) {
      switch(err.code) {
        case "ENOENT":
          //TODO: recursive function to create multi depth directory
          console.log(relativePath);
          return cb(new Error("NYI: multi depth directory, you have to create a dir first."));
          break;
        case "EACCES":
          return cb(new Error("Cannot access directory: " + destDir));
          break;
        default:
          return cb(err);
          break;
      }
    }

    //if relativePath is not a directory
    if(!stats.isDirectory()) return cb(new Error("Path: " + relativePath + " is not a directory."));

    //we set the new relativePath with the custom Directory: date or -c opts
    relativePath = path.join(relativePath, custDir);

    canCreateDir(relativePath, function(err, relativePath) {
      if(err) return cb(err);

      //it means the directory is already created so return directly
      if(err === false) return cb(null, relativePath);

      createDir(relativePath, function(err, relativePath) {
        if(err) return cb(err);

        return cb(null, relativePath);
      });

    });


  });

}

parseArgs(function(err, opts) {
  if(err) throw(err);

  verifyAndCreatePath(opts, function(err, relativePath) {
    if(err) throw(err);

    jsdom.env(
      opts.url,
      ["http://code.jquery.com/jquery.js"],
        function (errors, window) {
          var array = [];

          window.$("a").each(function() {
            var value = window.$(this).text();

            //TODO: desactivate case sensitive
            if(/(\.zip|\.gif|\.jpg)$/.test(value)) array.push(opts.url + "/" + value);
          });

          console.log("Found " + array.length.toString().green + " files at " + opts.url + "\n");
          console.log("Begin downloading: ".yellow + "\n");

          for(var i = 0; i < array.length; i++) {
            (function(i) {
              var finalPath = path.join(relativePath, path.basename(array[i]));

              var r = request(array[i]).pipe(fs.createWriteStream(finalPath));
              r.on('close', function() {
                console.log(finalPath + " [OK].".green);
              });
            }(i))
          }
        }
    );

  });

});

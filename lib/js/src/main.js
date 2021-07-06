'use strict';

var Fs = require("fs");
var List = require("bs-platform/lib/js/list.js");
var Glob = require("glob");
var Path = require("path");
var $$Array = require("bs-platform/lib/js/array.js");
var Config = require("./config.js");
var Extract = require("./extract.js");
var Js_dict = require("bs-platform/lib/js/js_dict.js");
var Js_option = require("bs-platform/lib/js/js_option.js");
var Pervasives = require("bs-platform/lib/js/pervasives.js");
var Child_process = require("child_process");

var out_dir = "__checkmarked__";

var config = Config.read(undefined);

function ensureDirExists(path) {
  var dir = Path.dirname(path);
  if (!Fs.existsSync(dir)) {
    ensureDirExists(dir);
    Fs.mkdirSync(dir);
    return ;
  }
  
}

function writeFile(filename, content) {
  var path = Path.join(out_dir, filename);
  ensureDirExists(path);
  Fs.writeFileSync(path, content);
  
}

function ruleFor(lang) {
  return Js_dict.get(config.rules, lang);
}

function checkCode(filename, rule) {
  return List.iter((function (task_spec) {
                var task = Js_dict.get(config.tasks, task_spec.name);
                if (task !== undefined) {
                  var cmd = task.command.replace(/\$\(file\)/, filename);
                  var args = task_spec.arguments;
                  var cmd$1 = args !== undefined ? cmd.replace(/\$\(args\)/, args) : cmd;
                  console.log(cmd$1);
                  Child_process.execSync(cmd$1, {
                        cwd: out_dir
                      });
                  console.log("done");
                  return ;
                }
                console.log("Task not found: " + task_spec.name);
                
              }), rule.tasks);
}

function checkFile(path) {
  console.log("Parsing " + path + "... ");
  List.iteri((function (i, param) {
          var lang = param[0];
          var rule = Js_dict.get(config.rules, lang);
          if (rule !== undefined) {
            var extension = Js_option.getWithDefault(lang, rule.extension);
            var target_file = "" + path + "." + i + "." + extension;
            writeFile(target_file, param[1]);
            Pervasives.print_string("Checking " + (target_file + "... "));
            return checkCode(target_file, rule);
          }
          console.log("No rule for language: " + lang);
          
        }), $$Array.to_list(Extract.extract(Fs.readFileSync(path, "utf8"))));
  console.log("");
  
}

List.map(checkFile, List.flatten(List.map((function (pattern) {
                return $$Array.to_list(Glob.sync(pattern));
              }), config.sources)));

exports.out_dir = out_dir;
exports.config = config;
exports.ensureDirExists = ensureDirExists;
exports.writeFile = writeFile;
exports.ruleFor = ruleFor;
exports.checkCode = checkCode;
exports.checkFile = checkFile;
/* config Not a pure module */

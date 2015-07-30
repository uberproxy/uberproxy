var NPM = require('npm');
var Fs  = require('fs');

exports.setup = function(parser) {
};

var packages = [];
function checkPackage(pkg) {
    if (pkg['uberproxy-plugin']) {
        packages.push([pkg.name.replace(/^uberproxy-?/i, ''), pkg.realPath]);
    }
};

exports.main = function(argv) {
NPM.load(function() {
    NPM.commands.list([], true, function(err, npm) {
        NPM.config.set("global", true);
        for (var i in npm.dependencies) {
            if (npm.dependencies.hasOwnProperty(i)) {
                checkPackage(npm.dependencies[i]);
            }
        }
        NPM.commands.list([], true, function(err, npm) {
            for (var i in npm.dependencies) {
                if (npm.dependencies.hasOwnProperty(i)) {
                    checkPackage(npm.dependencies[i]);
                }
            }
            Fs.writeFileSync(__dirname + "/../plugins/npm.js", "exports.plugin = "  + JSON.stringify(packages));
            console.log("Updated npm.js");
        });
    });
});
};

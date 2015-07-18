'use strict';

var Fs   = require('fs');
var YAML = require('yamljs');

function oct(n) {
    return parseInt(n, 8);
}

function canWrite(owner, inGroup, mode) {
    return owner && (mode & oct('00200')) || // User is owner and owner can write.
        inGroup && (mode & oct('00020') || // User is in group and group can write.
        (mode & oct('00002'))); // Anyone can write.
}

exports.isWritable = function(file, next) {
    if (next == null) { 
        var stat = Fs.statSync(file);
        return canWrite(process.getuid() === stat.uid, process.getgroups().indexOf(stat.gid) !== -1, stat.mode)
    }
    Fs.stat(file, function(err, stat) {
        if (err) return next(err);
        next(null, canWrite(process.getuid() === stat.uid, process.getgroups().indexOf(stat.gid) !== -1, stat.mode));
    });
};

exports.read = function(file) {
    var content = Fs.readFileSync(file).toString('utf-8');
    return file.match(/ya?ml$/i) ? YAML.parse(content) : JSON.parse(content);
};

exports.write = function(file, content, next) {
    var str = file.match(/ya?ml$/i) ? YAML.stringify(content, 8) : JSON.stringify(content, null, '    ');
    Fs.writeFile(file, str, next);
}

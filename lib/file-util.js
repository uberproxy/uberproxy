var Fs   = require('fs');
var YAML = require('yamljs');

exports.read = function(file) {
    var content = Fs.readFileSync(file).toString('utf-8');
    return file.match(/ya?ml$/i) ? YAML.parse(content) : JSON.parse(content);
};

exports.write = function(file, content, next) {
    var str = file.match(/ya?ml$/i) ? YAML.stringify(content, 8) : JSON.stringify(content, null, '    ');
    Fs.writeFile(file, str, next);
}

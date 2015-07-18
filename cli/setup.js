var Fs   = require('fs');
var Path = require('path');
var Crypto = require('crypto');
var FUtil  = require('../lib/file-util');

exports.setup = function(parser) {
    parser.addArgument(
        ['-c', '--config'],
        {
            action: 'store',
            type: function(f) {
                if (!FUtil.isWritable(Path.dirname(f))) throw new Error("Directory must be writable");
                return f;
            },
            help: 'Configuration file',
        }
    );
};

exports.main = function(argv) {

    var data = FUtil.read(__dirname + "/config.dist.yml");
    var dest = argv.config || "./config.yml";
    data.secret  = Crypto.randomBytes(32).toString('hex');
    data.cluster = require('os').cpus().length;
    FUtil.write(dest, data, function() {
        Fs.chmodSync(dest, 0600);
        console.log("Wrote "+ dest);
    });
};

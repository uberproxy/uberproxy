var Crypto = require('crypto');
var FUtil  = require('./lib/file-util');
var Fs     = require('fs');

var data = FUtil.read(__dirname + "/config.dist.yml");
var dest = "./config.yml";
if (process.argv[2]) {
    dest = process.argv[2];
}
data.secret  = Crypto.randomBytes(32).toString('hex');
data.cluster = require('os').cpus().length;
FUtil.write(dest, data, function() {
    Fs.chmodSync(dest, 0600);
    console.log("Wrote "+ dest);
});

var Apps = require('apps');
var Bloom = require('bloomfilter');

var bloom = new BloomFilter(1024 * 256, 16);

Apps.on('request', function(req, res) {
    return true;
});

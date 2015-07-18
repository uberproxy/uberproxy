#!/usr/bin/env node

var ArgumentParser = require('argparse').ArgumentParser;
var Fs = require('fs');

var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp:true,
    description: 'Argparse examples: sub-commands',
});

if (!process.argv[2]) {
    process.argv[2] = 'server';
}

Fs.readdir(__dirname + "/cli", function(err, files) {
    var sub  = parser.addSubparsers({title: 'Command to run' , dest: 'command'});
    var cmds = {};
    files.forEach(function(file) {
        if (!file.match(/\.js$/)) return;
        var name   = file.replace(/\..+$/, '');
        cmds[name] = require("./cli/" + file);
        cmds[name].setup(sub.addParser(name, {addHelp: true}));
    });
    var args = parser.parseArgs();
    cmds[args.command].main(args);
});

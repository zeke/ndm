#!/usr/bin/env node

var Config = require('../lib').Config,
  config = Config(),
  clc = require('cli-color'),
  _ = require('lodash'),
  yargs = require('yargs')
  .usage('Deploy service wrappers directly from npm packages\n\n'
    + 'Usage: ndm <command>\n\n'
    + 'where command is one of:\n\n'
    + '\tinit: initialize the deployment directory.\n'
    + '\tupdate: update service.json with newly installed packages.\n'
    + '\tgenerate: generate service wrappers from service.json.\n'
    + '\tstart: start all service wrappers.\n'
    + '\trestart: restart all service wrappers.\n'
    + '\tstop: stop all service wrappers.\n')
  .options('s', {
    alias: 'service-json',
    describe: 'path to the JSON file that describes your services',
    default: config.serviceJson
  })
  .options('n', {
    alias: 'node-bin',
    describe: 'where is the node.js binary located?',
    default: config.nodeBin
  })
  .options('p', {
    alias: 'platform',
    describe: 'what platform should we generate scripts for (centos|darwin|ubuntu).',
    default: config.platform
  })
  .options('d', {
    alias: 'sudo',
    describe: 'should sudo be used to start services.',
    default: config.sudo
  }),
  Installer = require('../lib').Installer,
  Service = require('../lib').Service;

if (yargs.argv.help || !yargs.argv._.length) {
  console.log(yargs.help());
} else {
  // update configuration singleton with args.
  _.keys(config).forEach(function(key) {
    if (yargs.argv[key]) {
      config[key] = _.isArray(yargs.argv[key]) ? yargs.argv[key][0] : yargs.argv[key];
    }
  });

  config = Config(config);

  try {
    switch(yargs.argv._[0]) {
      case 'init': // initialize a new ndm directory.
        console.log("initializing ndm directory:\n");
        (new Installer()).init();
        printInitMessage();
        break;
      case 'update': // initialize a new ndm directory.
        console.log("updating service.json:\n");
        (new Installer()).update();
        printInitMessage();
        break;
      case 'generate': // generate the ndm service wrappers.
        console.log('generating service wrappers:')
        Service.allServices().forEach(function(service) {
          service.generateScript();
          console.log(clc.yellow("  generated " + service.scriptPath()));
        });
        printRunMessage();
        break;
      case 'start':
        runCommand('start', 'starting all services:')
        break;
      case 'stop':
        runCommand('stop', 'stopping all services:')
        break;
      case 'restart':
        runCommand('restart', 'restarting all services:')
        break;
      default:
        console.log(yargs.help());
        break;
    }
  } catch (e) { // something bad happened.
    console.log("\n" + clc.red(e.message));
  }
}

// helper for executing CLI command.
function runCommand(command, message) {
  console.log(message)
  Service.allServices().forEach(function(service) {
    service.runCommand(command, function(err) {
      if (err) {
        console.log(clc.red("could not " + command + " all services. make sure you have run " + clc.green("ndm-generate")))
      } else {
        console.log(clc.yellow("  " + command + " " + service.scriptPath()));
      }
    });
  });
}

function printRunMessage() {
  console.log("\nto start a all services run:\n  " + clc.green("ndm start"));
  console.log("or manually start the service using " + clc.green("launchctl") + ", " + clc.green("initctl") + ", or " + clc.green("upstart\n"));
  console.log(clc.green('success!'));
};

function printInitMessage() {
  console.log("\nedit " + clc.green("service.json") + " to setup your application's environment.");
  console.log("when you're ready, run " + clc.green('ndm generate') + " to generate service wrappers.");
  console.log("add dependencies to " + clc.green("package.json") + " and run " + clc.green('ndm update') + " to add additional services.\n");
  console.log(clc.green('success!'));
};

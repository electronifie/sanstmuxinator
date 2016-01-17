var _ = require('lodash');
var async = require('async');
var childProcess = require('child_process');
var path = require('path');
var psTree = require('ps-tree');
var readYaml = require('read-yaml');

// Kill all spawned processes on exit

function exitHandler(err) {
  if (err) {
    console.log(err);
  }
  psTree(process.pid, function (err, children) {
    var killProc = childProcess.spawn('kill', ['-9'].concat(children.map(function (proc) {return proc.PID})));
    killProc.on('close', function () { process.exit(); });
  });
}

process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('uncaughtException', exitHandler);

module.exports = {
  run: function (options, cb) {
    var configPath = options.configPath;
    var logBaseDir = options.logBaseDir;
    var cwd = options.cwd;
    var noLogDirs = options.noLogDirs;

    readYaml(configPath, function(err, data) {
      if (err) throw err;

      // Extract process descriptors from config
      var processes = [];
      var addProcess = function (logPath, commands) { processes.push({ logPath: logPath, commands: commands }); };

      _.each(data.windows, function (windowObj) {
        _.each(windowObj, function (windowConfig, windowName) {
          if ( _.isString(windowConfig) ||  _.isArray(windowConfig) ) {
            addProcess([ windowName ], _.isString(windowConfig) ? [ windowConfig ] : windowConfig );
          } else if ( windowConfig.panes ) {
            _.each(windowConfig.panes, function (paneObj) {
              _.each(paneObj, function (paneCommands, paneName) {
                addProcess([ windowName, paneName ], _.isString(paneCommands) ? [ paneCommands ] : paneCommands);
              });
            })
          } else {
            console.error('Could not understand window config: \n' + JSON.stringify(windowConfig, null, 2));
            process.exit(1);
          }
        });
      });

      // Start process
      var processDetails = processes.map(function (process) {
        var logPath = process.logPath;
        var commands = process.commands;

        if (noLogDirs) {
          logPath = [logPath.join('-')];
        }

        var absoluteLogPath = path.join.apply(path, [logBaseDir].concat(logPath)) + '.log';
        var absoluteLogDir = path.dirname(absoluteLogPath);
        var command = 'mkdir -p \'' + absoluteLogDir + '\'; (' + commands.join('; ') + ') &> ' + absoluteLogPath;

        console.log('Running:', command);
        var proc = childProcess.spawn('/bin/bash', ['-c', command], { cwd: cwd, stdio: ['ignore', 'ignore', 'ignore'] });
        proc.on('close', function () { console.log('FINISHED: ', absoluteLogPath); });

        return {
          name: logPath.join('_'),
          logPath: logPath,
          commands: commands,
          commandWithLog: command,
          process: proc
        };
      });

      if (cb) cb(processDetails);
    });
  }
};

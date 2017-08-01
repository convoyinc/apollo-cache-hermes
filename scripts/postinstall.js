#!/usr/bin/env node
/* eslint-disable */
var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');

var node_modules = path.resolve(__dirname, '..', 'node_modules');
var temp_modules = node_modules + '.tmp';
var dev_modules  = node_modules + '.dev';

// When installing directly from GitHub, we get the TypeScript source, but none
// of the compiled JavaScript.
function isCompiled() {
  try {
    return !!require.resolve('.');
  } catch (error) {
    return false;
  }
}

function isDirectory() {
  var fullPath = path.join.apply(path, arguments);
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch (error) {
    return false;
  }
}

// When installing directly from GitHub, we get the source, but none of the
// compiled JavaScript.
if (isDirectory(node_modules, 'typescript') || isCompiled()) return;

// Install our dev dependencies (aka TypeScript) into a sandbox, so that we can
// compile our code.
if (isDirectory(node_modules)) {
  fs.renameSync(node_modules, temp_modules);
}

var runner = /yarn/i.test(process.env.npm_config_user_agent) ? 'yarn' : 'npm';

process.stdout.write('Compiling TypeScript sources… ');
childProcess.execSync(runner + ' install');
childProcess.execSync(runner + ' run compile');
process.stdout.write('done\n');

// Restore any production dependencies.
fs.renameSync(node_modules, dev_modules);
if (isDirectory(temp_modules)) {
  fs.renameSync(temp_modules, node_modules);
}

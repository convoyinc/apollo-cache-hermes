#!/usr/bin/env node
/* eslint-disable */
var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');

var node_modules = path.resolve(__dirname, '..', 'node_modules');
var temp_modules = node_modules + '.tmp';

function isDirectory() {
  var fullPath = path.join.apply(path, arguments);
  return fs.statSync(fullPath).isDirectory();
}

// When installing directly from GitHub, we get the source, but none of the
// compiled JavaScript.
if (isDirectory(node_modules, 'typescript')) return;

// Install our dev dependencies (aka TypeScript) into a sandbox, so that we can
// compile our code.
if (isDirectory(node_modules)) {
  fs.renameSync(node_modules, temp_modules);
}

const runner = /yarn/i.test(process.env.npm_config_user_agent) ? 'yarn' : 'npm';

console.log('Compiling TypeScript sources…');
childProcess.execSync(runner + ' install');
childProcess.execSync(runner + ' run compile');

// Sneaky, but rimraf is included as a devDependency.
require('rimraf').sync(node_modules);

// Restore any production dependencies.
if (isDirectory(temp_modules)) {
  fs.renameSync(temp_modules, node_modules);
}

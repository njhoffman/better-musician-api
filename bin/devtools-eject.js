const _ = require('lodash');
const { copyFileSync, readdirSync } = require('fs');
const appRoot = require('app-root-path');
const os = require('os');

const localDir = `${appRoot}/config/hosts/${os.hostname}`;
const localFiles = readdirSync(localDir);
const baseFiles = _.without(readdirSync(`${appRoot}/bin/devtools`), ...localFiles);

localFiles.forEach(file => {
  copyFileSync(`${localDir}/${file}`, `${appRoot}/${file}`);
});

baseFiles.forEach(file => {
  copyFileSync(`${appRoot}/bin/devtools/${file}`, `${appRoot}/${file}`);
});

console.log(
  `\nCopied ${baseFiles.length} (base), ${localFiles.length} (local) dev scripts to project root for "${os.hostname}"`
);

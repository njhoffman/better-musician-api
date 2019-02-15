const _ = require('lodash');
const path = require('path');
const { copyFileSync, readdirSync } = require('fs');
const appRoot = require('app-root-path');
const os = require('os');

const localDir = `${appRoot}/config/hosts/${os.hostname}`;
const aliasDir = `${appRoot}/bin/devtools/aliases`;
const localFiles = readdirSync(localDir);
const baseFiles = _.without(readdirSync(aliasDir), ...localFiles);

localFiles.forEach(file => (
  copyFileSync(path.join(localDir, file), `${appRoot}/${file}`)
));

baseFiles.forEach(file => (
  copyFileSync(path.join(aliasDir, file), `${appRoot}/${file}`)
));

console.log(
  `\nCopied ${baseFiles.length} (base), ${localFiles.length}`,
  `(local) dev scripts to project root for "${os.hostname}"`
);

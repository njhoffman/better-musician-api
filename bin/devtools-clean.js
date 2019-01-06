const _ = require('lodash');
const { unlinkSync, readdirSync } = require('fs');
const appRoot = require('app-root-path');
const os = require('os');

const localDir = `${appRoot}/config/hosts/${os.hostname}`;
const localFiles = readdirSync(localDir);
const baseFiles = _.without(readdirSync(`${appRoot}/bin/devtools`), ...localFiles);

const nodemonFiles = readdirSync(`${appRoot}`).filter(file => /nodemon-*.json/.test(file));

localFiles.forEach(file => {
  unlinkSync(`${appRoot}/${file}`);
});

baseFiles.forEach(file => {
  unlinkSync(`${appRoot}/${file}`);
});

console.log([
  `\nCleaned ${baseFiles.length + localFiles.length} dev scripts, `,
  `${nodemonFiles.length} nodemon files from project root for "${os.hostname}"`
].join(' '));

#!/usr/bin/env node

/* eslint-disable import/no-dynamic-require, global-require */

const _ = require('lodash');
const async = require('async');
const fs = require('fs');
const chalk = require('chalk');
const appRoot = require('app-root-path');
const { argv } = require('yargs');


const models = require(`${appRoot}/lib/models/all`)();
const baseData = require(`${appRoot}/lib/models/seed/base`);

const requireFile = (loc) => {
  delete require.cache[require.resolve(loc)];
  return require(loc);
};

const directoryExists = (path, done) => fs.stat(path,
  (err, stat) => {
    if (err && err.code === 'ENOENT') {
      done(null, false);
    } else if (err) {
      done(err);
    } else {
      done(null, true);
    }
  });

const readDirectory = (dir, done) => fs.readdir(dir, done);
const makeDirectory = (dir, done) => fs.mkdir(dir, done);

const emptyFiles = (path, allDone) => {
  const removeFile = (file, done) => fs.unlink(`${path}/${file}`, done);

  readDirectory(path, (err, files) => {
    if (err) {
      allDone(err);
    } else if (files.length > 0) {
      console.log(`Emptying ${path} of ${files.length} files`);
      async.each(files, removeFile, allDone);
    } else {
      allDone(null);
    }
  });
};


const writeSeedData = (name, data, allDone) => {
  const outputDir = `${appRoot}/lib/models/seed/data/${name}`;

  const writeFile = (records, tableName, done) => {
    const filePath = `${outputDir}/${tableName}.json`;
    console.log(
      `...writing ${chalk.cyan(records.length)} records to file ${chalk.bold(filePath)}`
    );
    const jsonOut = records.map(record => `\n  ${JSON.stringify(record)}`);
    fs.writeFile(filePath, `[${jsonOut}\n]`, done);
  };

  return async.waterfall([
    (done) => directoryExists(outputDir, done),
    (dirExists, done) => {
      if (dirExists) {
        emptyFiles(outputDir, done);
      } else {
        makeDirectory(outputDir, done);
      }
    },
    (done) => async.eachOf(data, writeFile, done)
  ], allDone);
};

const loadTemplate = (name, done) => {
  const templatePath = `${appRoot}/lib/models/seed/templates/${name}`;
  console.log(`Active models: ${_.keys(models).join(', ')}\n`);
  console.log(`Running template at: ${chalk.cyan(templatePath)}\n`);
  const runTemplate = requireFile(templatePath);
  const seedData = runTemplate(models, baseData);
  const totalRecords = _.sumBy(_.keys(seedData), table => seedData[table].length);
  console.log(
    `Seed data generated for ${chalk.cyan(_.keys(seedData).length)} tables, ${chalk.cyan(totalRecords)} records\n`
  );
  done(null, seedData);
};

console.log(chalk.bold('\n-- BetterMusician-api seeder --\n'));

if (_.isEmpty(argv)) {
  console.log('No arguments provided');
  // print arguments
} else {
  // console.log(argv);
  const templateName = 'dev-users';
  async.waterfall([
    (done) => loadTemplate(templateName, done),
    (seedResults, done) => writeSeedData(templateName, seedResults, done)
  ], (err, results) => {
    if (err) {
      console.error(err);
    } else {
      console.log(chalk.bold('\nFinished successfully.\n\n'));
    }
  });
}

/* eslint-enable import/no-dynamic require, global-require */

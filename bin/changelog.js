/* eslint-disable no-console */
require('../config/babel');

const _ = require('lodash');
const fs = require('fs');
const appRoot = require('app-root-path');
const async = require('async');
const chalk = require('chalk');
const path = require('path');
// const { writeFileSync } = require('fs');
const { initConfig } = require('../config');
const platoReports = require('./plato');

const {
  commitSummary,
  fileDiff,
  depDiff
} = require('./changelog/git');

const {
  mdHeader,
  mdFileChanges,
  mdSummary,
  mdTestSummary,
  mdBody,
  mdDepSummary,
  mdDepOutdated,
  mdDepDiff
} = require('./changelog/markdown');

const {
  getOptions,
  outdatedDeps,
  mochaTests,
  coverageData,
  annotationsData
} = require('./changelog/utils');

const {
  version,
  dependencies,
  devDependencies
}  = require(`${appRoot}/package.json`);


const getData = (options, allDone) => {
  const { lastVersion, targetVersion, sections } = options;
  console.log(
    `\nProcessing changes from ${chalk.cyan(lastVersion)} to ${chalk.cyan(targetVersion)}`
  );
  const dataFuncs = {
    options: (done) => done(null, options),
    commits: (done) => commitSummary(lastVersion, targetVersion, done),
    files: (done) => fileDiff(lastVersion, targetVersion, done),
    depsDiff: (done) => depDiff(lastVersion, targetVersion, done),
    // below cannot be ran with a custom targetVersion, must be currVersion
    // only fields of interest for tag file data
    tests: (done) => mochaTests(done),
    coverage: (done) => coverageData(done),
    annotations: (done) => annotationsData(done),
    depsOutdated: (done) => outdatedDeps(done),
    summary: (done) => platoReports(done)
  };

  const dataKeys = [..._.keys(sections), 'options'];
  async.series(_.pick(dataFuncs, dataKeys), allDone);
};

const writeTagFile = (data, done) => {
  const { options: { createTag, targetVersion } } = data;
  const tagDataKeys = ['tests', 'coverage', 'annotations', 'depsOutdated', 'summary'];
  const tagData = _.pick(data, tagDataKeys);
  if (createTag) {
    console.log(chalk.green(`\n-- Creating tag file ${createTag}`));
    fs.writeFileSync(`${createTag}`, JSON.stringify(tagData));
  } else {
    console.log(`\n-- Tag file exists for v${targetVersion}, skipping write`);
  }
  done(null, data);
};


const generateMarkdown = (data, allDone) => {
  const {
    options, commits, files, depsOutdated,
    depsDiff, tests, coverage, annotations, summary
  } = data;

  const { targetVersion, lastVersion, sections, trunkPath } = options;

  const markdown = [
    mdHeader(targetVersion),
    sections.files ? mdFileChanges(lastVersion, files, commits.total) : '',
    mdBody(trunkPath),
    sections.summary ? mdSummary(summary, annotations) : '',
    sections.tests ? mdTestSummary(tests, coverage) : '',
    sections.depsOutdated ? mdDepSummary({
      outdated: depsOutdated.length,
      prod: Object.keys(dependencies).length,
      dev: Object.keys(devDependencies).length
    }) : '',
    sections.depsOutated ? mdDepOutdated(depsOutdated) : '',
    sections.depsDiff ? mdDepDiff(depsDiff) : ''
  ].filter(Boolean).join('\n\n');

  console.log(`\n-- Generated ${chalk.bold(markdown.length)} lines of markdown`);
  allDone(null, { ...options, markdown });
};

const writeMdFiles = ({
  markdown,
  nextVersion,
  targetVersion,
  outputDir,
  trunkPath
}, allDone) => {
  const mdPath = path.resolve(outputDir, `${targetVersion}.md`);

  if (fs.existsSync(`${mdPath}`)) {
    console.log(chalk.red(`\nMarkdown file "${mdPath}" exists, skipping write`));
  } else {
    console.log(chalk.green(`\n-- Writing markdown to file: \t\t${mdPath}`));
    fs.writeFileSync(`${mdPath}`, markdown);
    console.log(chalk.green(`\n-- Resetting trunk file for v${chalk.bold(nextVersion)}: \t${trunkPath}`));
  }
  allDone(null, markdown);
};


const checkTagFile = ({ tagsDir, currVersion }, done) => {
  const tagPath = path.join(`${tagsDir}`, `${currVersion}.json`);
  done(null, !fs.existsSync(tagPath) ? tagPath : false);
};

initConfig().then(({ changeLog, appName }) => {
  console.log(chalk.bold(`\n-- ${appName} changelog markdown generator --\n`));
  const opts = { ...changeLog, currVersion: version };
  async.waterfall([
    (done) => checkTagFile(opts, done),
    (createTag, done) => getOptions({ ...opts, createTag }, done),
    getData,
    writeTagFile,
    generateMarkdown,
    writeMdFiles
  ], (err, results) => {
    console.log('\n\n** Generated Markdown **\n');
    console.log(results);
  });
});


/* eslint-enable no-console */

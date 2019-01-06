/* eslint-disable no-console */

const async = require('async');
const chalk = require('chalk');
const { argv } = require('yargs');
// const { writeFileSync } = require('fs');

const platoReports = require('./plato');

const {
  commitSummary,
  fileDiff,
  depDiff
} = require('./git');

const {
  mdHeader,
  mdChanges,
  mdSummary,
  mdBody,
  mdDepSummary,
  mdDepOutdated,
  mdDepDiff
} = require('./changelog/templates');

const {
  incrementVersion,
  getMdPath,
  outdatedDeps
} = require('./changelog/utils');

const { version: currVersion, dependencies, devDependencies }  = require('../package.json');

const trunkPath = getMdPath('trunk');

const getVersionInfo = (done) => {
  const isMajorVersion = Object.keys(argv).some(arg => /major|--major/i.test(arg));
  const lastVersion = currVersion.replace(/\.\d+$/, '.0');
  const newVersion = incrementVersion(lastVersion, isMajorVersion);
  const nextVersion = incrementVersion(newVersion, false);

  done(null, { lastVersion, newVersion, nextVersion });
};

const getData = ({ lastVersion, newVersion, nextVersion }, allDone) => {
  console.log(
    `\nProcessing changes from ${chalk.cyan(lastVersion)} to ${chalk.cyan(newVersion)}`
  );
  async.series({
    commits: (done) => commitSummary(lastVersion, currVersion, done),
    summary: (done) => fileDiff(lastVersion, done),
    depsOutdated: (done) => outdatedDeps(done),
    depsDiff: (done) => depDiff(lastVersion, done),
    plato: (done) => platoReports(done),
    versions: (done) => done(null, { lastVersion, newVersion, nextVersion })
  }, allDone);
};

const generateMarkdown = ({
  summary,
  commits,
  depsOutdated,
  depsDiff,
  plato,
  versions
}, allDone) => {
  const { newVersion, lastVersion, nextVersion } = versions;
  console.log([
    '  -- Got results with',
    `${chalk.bold(commits.total)} commits,`,
    `${chalk.bold(Object.keys(depsDiff.prod).length)} production dependencies`,
    `${chalk.bold(Object.keys(depsDiff.dev).length)} development dependencies`
  ].join(' '));

  const markdown = [
    mdHeader(newVersion),
    mdChanges(lastVersion, summary, commits.total),
    mdSummary(plato),
    mdBody(trunkPath),
    mdDepSummary({
      outdated: depsOutdated.length,
      prod: Object.keys(dependencies).length,
      dev: Object.keys(devDependencies).length
    }),
    mdDepOutdated(depsOutdated),
    mdDepDiff(depsDiff)
  ].join('\n\n');

  console.log(`  -- Generated ${chalk.bold(markdown.length)} lines of markdown`);
  allDone(null, { markdown, newVersion, nextVersion });
};

const writeFiles = ({ markdown, nextVersion, newVersion }, allDone) => {
  const mdPath = getMdPath(newVersion);
  console.log(`  -- Writing markdown to file: \t\t${mdPath}`);
  console.log(`  -- Resetting trunk file for v${chalk.bold(nextVersion)}: \t${trunkPath}`);
  allDone(null, markdown);
};

async.waterfall([
  getVersionInfo,
  getData,
  generateMarkdown,
  writeFiles
], (err, results) => {
  console.log(results);
  console.log('\n\n');
});

/* eslint-enable no-console */

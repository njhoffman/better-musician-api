/* eslint-disable no-console */

const async = require('async');
const appRoot = require('app-root-path');
const chalk = require('chalk');
const path = require('path');
const { argv } = require('yargs');
// const { writeFileSync } = require('fs');

const platoReports = require('./plato');

const {
  commitSummary,
  fileDiff,
  depDiff
} = require('./changelog/git');

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
  outdatedDeps
} = require('./changelog/utils');

const { version: currVersion, dependencies, devDependencies }  = require(`${appRoot}/package.json`);

const trunkPath = `${appRoot}/docs/changelogs/trunk.md`;

const getOptions = (done) => {
  const isMajorVersion = Object.keys(argv).some(arg => /major|--major/i.test(arg));
  const lastVersion = argv.lastversion || argv.last || currVersion.replace(/\.\d+$/, '.0');
  const newVersion = argv.newversion || argv.new || incrementVersion(lastVersion, isMajorVersion);
  const outputDir = argv.output || argv.out || `${appRoot}/docs/changelogs`;
  const nextVersion = incrementVersion(newVersion, false);

  done(null, { lastVersion, newVersion, nextVersion, outputDir });
};

const getData = (options, allDone) => {
  const { lastVersion, newVersion } = options;
  console.log(
    `\nProcessing changes from ${chalk.cyan(lastVersion)} to ${chalk.cyan(newVersion)}`
  );
  async.series({
    commits: (done) => commitSummary(lastVersion, currVersion, done),
    summary: (done) => fileDiff(lastVersion, done),
    depsOutdated: (done) => outdatedDeps(done),
    depsDiff: (done) => depDiff(lastVersion, done),
    plato: (done) => platoReports(done),
    options: (done) => done(null, options)
  }, allDone);
};

const generateMarkdown = ({
  summary,
  commits,
  depsOutdated,
  depsDiff,
  plato,
  options
}, allDone) => {
  const { newVersion, lastVersion } = options;
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
  allDone(null, { ...options, markdown });
};

const writeFiles = ({ markdown, nextVersion, newVersion, outputDir }, allDone) => {
  const mdPath = path.resolve(outputDir, `${newVersion}.md`);

  console.log(`  -- Writing markdown to file: \t\t${mdPath}`);
  console.log(`  -- Resetting trunk file for v${chalk.bold(nextVersion)}: \t${trunkPath}`);
  allDone(null, markdown);
};

async.waterfall([
  getOptions,
  getData,
  generateMarkdown,
  writeFiles
], (err, results) => {
  console.log(results);
  console.log('\n\n');
});

/* eslint-enable no-console */

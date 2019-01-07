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
  outdatedDeps,
  mochaTests,
  coverageData,
  annotationsData
} = require('./changelog/utils');

const { version: currVersion, dependencies, devDependencies }  = require(`${appRoot}/package.json`);

const trunkPath = `${appRoot}/docs/changelogs/trunk.md`;

const getOptions = (done) => {
  const isMajorVersion = Object.keys(argv).some(arg => /major|--major/i.test(arg));
  const lastVersion = argv.lastversion || argv.last || currVersion.replace(/\.\d+$/, '.0');
  const targetVersion = argv.targetversion || argv.target || incrementVersion(lastVersion, isMajorVersion);
  const outputDir = argv.output || argv.out || `${appRoot}/docs/changelogs`;
  const nextVersion = incrementVersion(targetVersion, false);

  if (argv.targetversion || argv.target) {
    console.log(chalk.yellow([
      `Target version overridden to ${targetVersion}, plato reports,`,
      'mocha tests and dependency summary disabled'
    ].join(' ')));
  }
  done(null, { lastVersion, targetVersion, nextVersion, outputDir });
};

const getData = (options, allDone) => {
  const { lastVersion, targetVersion } = options;
  console.log(
    `\nProcessing changes from ${chalk.cyan(lastVersion)} to ${chalk.cyan(targetVersion)}`
  );
  async.series({
    options: (done) => done(null, options),
    commits: (done) => commitSummary(lastVersion, targetVersion, done),
    summary: (done) => fileDiff(lastVersion, targetVersion, done),
    depsDiff: (done) => depDiff(lastVersion, targetVersion, done),
    // the following cannot be ran with a custom targetVersion, must be currentVersion
    tests: (done) => mochaTests(done),
    coverage: (done) => coverageData(done),
    annotations: (done) => annotationsData(done),
    depsOutdated: (done) => outdatedDeps(done),
    plato: (done) => platoReports(done)
  }, allDone);
};

const generateMarkdown = ({
  summary,
  commits,
  depsOutdated,
  depsDiff,
  plato,
  tests,
  coverage,
  options
}, allDone) => {
  const { targetVersion, lastVersion } = options;
  console.log([
    '  -- Got results with',
    `${chalk.bold(commits.total)} commits,`,
    `${chalk.bold(Object.keys(depsDiff.prod).length)} ~ prod dependencies`,
    `${chalk.bold(Object.keys(depsDiff.dev).length)} ~ dev dependencies`
  ].join(' '));

  console.log('tests', tests, 'coverage', coverage);
  // TODO: tests % lines, % branch, total passing tests, failing tests
  // TODO: centralize configuration in config, count TODOs

  const markdown = [
    mdHeader(targetVersion),
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

const writeFiles = ({ markdown, nextVersion, targetVersion, outputDir }, allDone) => {
  const mdPath = path.resolve(outputDir, `${targetVersion}.md`);

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

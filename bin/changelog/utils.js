const _ = require('lodash');
const appRoot = require('app-root-path');
const fs = require('fs');
const npm = require('npm');
const chalk = require('chalk');
const { spawn } = require('child_process');

const incrementVersion = (baseVersion, isMajorVersion) => (
  isMajorVersion ? [
    `${(parseInt(baseVersion.split('.')[0], 10) + 1)}`,
    '0',
    '0'
  ] : [
    `${baseVersion.split('.')[0]}`,
    `${(parseInt(baseVersion.split('.')[1], 10) + 1)}`,
    '0'
  ]
).join('.');

const outdatedDeps = (done) => npm.load(() => {
  console.log('\n** Looking up outdated dependency information **\n');
  npm.commands.outdated((err, rawOutdated) => {
    const outdated = rawOutdated.map(od => ({
      name       : od[1],
      current    : od[2],
      wanted     : od[3],
      latest     : od[4],
      definition : od[5]
    }));
    done(null, outdated);
  });
});


const mochaTests = (done) => {
  console.log('\n** Running mocha tests with istanbul instrument coverage **\n');
  const mochaBin = `${appRoot}/node_modules/.bin/nyc`;
  const mochaArgs = [
    `${appRoot}/node_modules/.bin/mocha`,
    '--reporter=json'
  ];
  const mochaEnv = { NODE_ENV: 'test', NODE_TEST_QUIET: '1' };
  const mocha = spawn(
    mochaBin,
    mochaArgs, {
      env: { ...process.env, ...mochaEnv },
      cwd: `${appRoot}`
    }
  );

  let testResults = '';
  mocha.stdout.on('data', (data) => {
    testResults += data;
  });

  mocha.stdout.on('end', (data) => {
    testResults += data || '';
    const jsonResults = JSON.parse(testResults);
    const { suites, tests, passes, failures, duration } = jsonResults.stats;

    console.log([
      `  Ran ${chalk.cyan(tests)} tests in ${chalk.bold(suites)}`,
      `test suites in ${chalk.bold(parseFloat(duration / 1000))}ms`,
      `\n  ${chalk.green(passes)} Passed  ${chalk.red(failures)} Failed\n`
    ].join(' '));

    done(null, jsonResults.stats);
  });
};

const coverageData = (done) => {
  const jsonSummaryFile = `${appRoot}/reports/coverage/coverage-summary.json`;
  console.log(`\n** Loading coverage data: ${jsonSummaryFile} **\n`);
  const summaryData = fs.readFileSync(jsonSummaryFile);
  const summaryJson = JSON.parse(summaryData);
  // // total, covered, skipped, pct
  Object.keys(summaryJson.total).forEach(key => {
    const { total, covered, pct } = summaryJson.total[key];
    console.log([
      `  ${_.startCase(key)} \t`,
      `${chalk.cyan(pct)}%  \t${chalk.bold(covered)}/${chalk.bold(total)}`
    ].join(' '));
  });
  done(null, summaryJson.total);
};

const annotationsData = (done) => {
  console.log('\n** Scanning for annnotations **\n');
  const notesBin = `${appRoot}/node_modules/.bin/notes`;
  const notesArgs = [
    '-g',
    '.gitignore'
  ];
  const notes = spawn(
    notesBin,
    notesArgs, {
      cwd: `${appRoot}`
    }
  );

  let notesResults = '';
  notes.stdout.on('data', (data) => {
    notesResults += data;
  });

  notes.stdout.on('end', (data) => {
    notesResults += data || '';
    const annotations = { todo: 0, fixme: 0, optimize: 0, note: 0 };
    notesResults.split('\n').forEach(line => {
      if (/ TODO: /.test(line)) {
        annotations.todo += 1;
      } else if (/ FIXME: /.test(line)) {
        annotations.fixme += 1;
      } else if (/ OPTIMIZE: /.test(line)) {
        annotations.optimize += 1;
      } else if (/ NOTE: /.test(line)) {
        annotations.note += 1;
      }
    });

    console.log([
      `  TODO: ${chalk.bold(annotations.todo)} \tFIXME: ${chalk.bold(annotations.fixme)}`,
      `  OPTIMIZE: ${chalk.bold(annotations.optimize)} \tNOTE: ${chalk.bold(annotations.note)}`,
    ].join('\n'));

    done(null, annotations);
  });
};

module.exports = {
  outdatedDeps,
  incrementVersion,
  mochaTests,
  coverageData,
  annotationsData
};

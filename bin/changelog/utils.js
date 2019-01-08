const _ = require('lodash');
const appRoot = require('app-root-path');
const fs = require('fs');
const npm = require('npm');
const chalk = require('chalk');
const { spawn } = require('child_process');
const { argv } = require('yargs');

const { version: currVersion } = require(`${appRoot}/package.json`);

const numCommas = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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

const getOptions = (opts, done) => {
  // const isMajorVersion = argv.major || false;
  const { sections, createTag } = opts;

  const lastVersion = argv.lastversion
    || argv.last
    || currVersion.replace(/\.\d+$/, '.0');

  const targetVersion = argv.targetversion
    || argv.target
    || currVersion;
    // || incrementVersion(lastVersion, isMajorVersion);

  const outputDir = argv.output
    || argv.out
    || opts.outputDir;

  const nextVersion = incrementVersion(targetVersion, false);

  const trunkPath = `${outputDir}/trunk.md`;

  if (argv.targetversion || argv.target) {
    console.log(chalk.bold.red([
      `Target version overridden to ${targetVersion},`,
      `instead of current version: ${currVersion},`,
    ].join(' ')));

    console.log(chalk.yellow(
      '  **mocha tests, coverage, outdated dependencies`and plato summary disabled'
    ));

    _.unset(sections, 'summary');
    _.unset(sections, 'tests');
    _.unset(sections, 'coverage');
    _.unset(sections, 'annotations');
    _.unset(sections, 'depsOutdated');
  }

  done(null, {
    lastVersion,
    targetVersion,
    nextVersion,
    outputDir,
    trunkPath,
    sections,
    createTag
  });
};


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
    let jsonResults;
    try {
      jsonResults = JSON.parse(testResults);
    } catch (e) {
      console.log(chalk.red('\n!! Error parsing JSON for mocha tests results'));
      console.error(e);
      return done(null, {});
    }

    const { suites, tests, passes, failures, duration } = jsonResults.stats;

    console.log([
      `  Ran ${chalk.cyan(tests)} tests in ${chalk.bold(suites)}`,
      `test suites in ${chalk.bold(parseFloat(duration / 1000))}ms`,
      `\n  ${chalk.green(passes)} Passed  ${chalk.red(failures)} Failed\n`
    ].join(' '));

    return done(null, jsonResults.stats);
  });
};

const coverageData = (done) => {
  const jsonSummaryFile = `${appRoot}/reports/coverage/coverage-summary.json`;
  console.log(`\n** Loading coverage data: ${jsonSummaryFile} **\n`);
  const summaryData = fs.readFileSync(jsonSummaryFile);

  let summaryJson;
  try {
    summaryJson = JSON.parse(summaryData);
  } catch (e) {
    console.log(chalk.red('\n!! Error parsing JSON for istanbul coverage results'));
    console.error(e);
    return done(null, {});
  }

  Object.keys(summaryJson.total).forEach(key => {
    const { total, covered, pct } = summaryJson.total[key];
    console.log([
      `  ${_.startCase(key)} \t`,
      `${chalk.cyan(pct)}%  \t${chalk.bold(covered)}/${chalk.bold(total)}`
    ].join(' '));
  });
  return done(null, summaryJson.total);
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
  getOptions,
  outdatedDeps,
  incrementVersion,
  mochaTests,
  coverageData,
  annotationsData,
  numCommas
};

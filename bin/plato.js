#!/usr/bin/env node

// TODO: fix eslint produces spaced-comment error from shebang

const _ = require('lodash');
const chalk = require('chalk');
const async = require('async');
// TODO: need forked version of es6-plato with up to date eslint dependencies
const plato = require('es6-plato');
const path = require('path');
const appRoot = require('app-root-path');
const { statSync, mkdirSync, readdirSync, readFileSync } = require('fs');

// const initLogger = require(`${appRoot}/shared/logger/terminal`);
// const { warn, info, trace } = initLogger('plato-reports');
const { warn, info, info: trace } = console;

let outputFiles = true;
const verbosity = 1; // 0, 1, or 2 (most verbose)
const reportsDir = `${appRoot}/reports/plato`;

// TODO: make this and file output configurable with commands
const targetDirs = [
  `${appRoot}/bin`,
  `${appRoot}/config`,
  `${appRoot}/lib`,
  `${appRoot}/test`
];

const ignoredFiles = [
  // '/src/routes/Register/index.js'
];

const mkdir = (dirPath) => {
  if (outputFiles) {
    try {
      mkdirSync(dirPath);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    }
  }
};

const walkSync = (dir, files = []) => {
  readdirSync(dir).forEach(file => {
    /* eslint-disable no-param-reassign */
    files = statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), files)
      : files.concat(path.join(dir, file));
    /* eslint-enable no-param-reassign */
  });
  return files;
};

const prepareOptions = (done) => {
  const startTime = new Date().getTime();
  const outputDir = !outputFiles ? '/tmp/plato' : path.join(reportsDir, `${Date.now()}`);
  const lintRules = JSON.parse(readFileSync(`${appRoot}/bin/.eslintrc`, { encoding: 'utf8' }));

  const parsedRules = {
    ...lintRules,
    rules: _.omit(lintRules.rules, 'react/jsx-no-bind'),
    globals: _.keys(lintRules.globals)
  };

  info(chalk.bold('\n** BetterMusician-api plato reports generator **\n'));
  info(`  Initializing plato reports for output to: ${outputDir}`);
  info(`  Crawling ${targetDirs.length} directories for js/jsx files...`);

  const fileList = [];
  targetDirs.forEach(targetDir => {
    info(`\t${targetDir}`);
    fileList.push(...walkSync(targetDir));
  });

  const filteredFiles = fileList.filter(file => {
    const ext = file.split('.').pop();
    let isIgnored = false;
    ignoredFiles.forEach(igFile => {
      if (file.indexOf(igFile) !== -1) {
        isIgnored = true;
      }
    });
    return (!isIgnored && (ext === 'js' || ext === 'jsx'));
  });

  info(`  Found ${filteredFiles.length} files to process.`);
  // filteredFiles.forEach((file, idx) => console.log(`\t${idx}: ${file}`));

  const platoOptions = {
    title: `Plato Report - ${new Date().toLocaleString()}`,
    eslint: parsedRules
  };

  mkdir(outputDir);

  done(null, {
    platoOptions,
    fileList: filteredFiles,
    outputDir,
    startTime
  });
};

const startPlato = ({ fileList, startTime, outputDir, platoOptions }, done) => {
  info(`  Running reports on: ${fileList.length} files`);
  plato.inspect(fileList, outputDir, platoOptions, (reports) => (
    done(null, { reports, startTime, fileList })
  ));
};

const processReports = ({ reports, startTime, fileList }, done) => {
  const elapsed = (new Date().getTime() - startTime) / 1000;
  info(
    `  Generated plato reports for ${chalk.bold(fileList.length)} files in ${elapsed} s\n`
  );
  //
  // complexity [ 'methodAggregate', 'settings', 'classes', 'dependencies', 'errors', 'filePath', 'lineEnd',
  //   'lineStart', 'maintainability', 'methods', 'methodAverage', 'srcPath', 'srcPathAlias',
  //   'module', 'aggregate', 'functions' ]

  reports.forEach((report, i) => {
    const {
      info: { file },
      // complexity,
      eslint: { messages }, // severity, line, colmn, message, fix
    } = report;

    if (messages.length > 0) {
      warn(`\t${file.replace(appRoot, '')}`);
    } else if (verbosity > 1) {
      trace(`\t${file.replace(appRoot, '')} : clean`);
    }

    messages.forEach(({ severity, line, column, message }) => (
      warn(`    ${severity.toUpperCase()}    ${line || 'XX'}:${column || 'XX'}     ${message}`)
    ));
  });

  const { summary: { total, average } } = plato.getOverviewReport(reports);
  done(null, { total, average, fileList });
};

if (require.main === module) {
  async.waterfall([
    prepareOptions,
    startPlato,
    processReports
  ], (err, { total, average, fileList }) => {
    info([
      '\nTotal ',
      `${chalk.bold(total.eslint)} es-lint errors`,
      `${chalk.bold(fileList.length)} files analyzed`,
      `${chalk.bold(total.sloc)} total code lines`,
      `${chalk.bold(parseInt(total.maintainability, 10))} maintainability`
    ].join('\n    '));

    info([
      `\nAverage ${chalk.bold(average.sloc)} lines per file with`,
      `${chalk.bold(average.maintainability)} maintainability per file.\n\n`
    ].join(' '));
  });
}

module.exports = (done) => {
  // dont output files when calling from another script
  outputFiles = false;
  async.waterfall([
    prepareOptions,
    startPlato,
    processReports
  ], done);
};

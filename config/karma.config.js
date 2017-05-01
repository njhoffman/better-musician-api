const argv = require('yargs').argv;
const project = require('./project.config');
const { debug } = require('debugger-256')('api:config:karma');

debug('Creating configuration.');
const karmaConfig = {
  basePath : '../', // project root in relation to bin/karma.js
  files    : [
    {
      pattern  : `./${project.dir_test}/test-bundler.js`,
      watched  : false,
      served   : true,
      included : true
    }
  ],
  singleRun     : !argv.watch,
  frameworks    : ['mocha'],
  reporters     : ['mocha'/*, 'mocha', 'spec', 'json', 'progress', 'dots' */],
  specReporter: {
    maxLogLines:          5,         // limit number of lines logged per test
    suppressErrorSummary: true,  // do not print error summary
    suppressFailed:       false,  // do not print information about failed tests
    suppressPassed:       false,  // do not print information about passed tests
    suppressSkipped:      true,  // do not print information about skipped tests
    showSpecTiming:       false // print the time elapsed for each spec
  },
  jsonReporter: {
    stdout: true
  },
  // plugins: ['karma-spec-reporter'],
  coverageReporter : {
    reporters : project.coverage_reporters
  }
};

if (project.globals.__COVERAGE__) {
  karmaConfig.reporters.push('coverage');
}

module.exports = (cfg) => cfg.set(karmaConfig);

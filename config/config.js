/* eslint key-spacing:0 spaced-comment:0 */
const path = require('path');
const { argv } = require('yargs');
const errorHandlers = require('lib/utils/error');
const { info, debug, trace } = require('lib/utils/logger')('config');
const environments = require('./environments');

info('Creating default configuration.');

// default/base configuration, can be overridden with environment files
const config = {
  env : process.env.NODE_ENV || 'development',
  path_base  : path.resolve(__dirname, '..'),
  dir_test   : 'tests',

  dbHost : process.env.DB_HOST || 'localhost',
  dbPort : process.env.DB_PORT || 28015,
  dbName : process.env.DB_NAME || 'better_musician',

  apiHost   : process.env.API_HOST || '0.0.0.0',
  apiPort   : process.env.API_PORT || 3001,
  API_SECRET : 'asjdkfjsdkgh',

  coverage_reporters : [
    { type : 'text-summary' },
    { type : 'lcov', dir : 'coverage' }
  ]
};

const initConfig = () => (
  new Promise(resolve => {
    // N.B.: globals added here must _also_ be added to .eslintrc
    config.globals = {
      NODE_ENV      : config.env,
      __DEV__       : config.env === 'development',
      __PROD__      : config.env === 'production',
      __TEST__      : config.env === 'test',
      __COVERAGE__  : !argv.watch && config.env === 'test',
      __BASENAME__  : JSON.stringify(process.env.BASENAME || ''),
      __SKIP_AUTH__ : config.env !== 'production'
    };

    debug(`Looking for environment overrides for NODE_ENV %${config.env}%`);
    const overrides = environments[config.env];
    if (overrides) {
      debug(overrides(config), 'Found overrides, applying to default configuration.');
      Object.assign(config, overrides(config));
    } else {
      debug('No environment overrides found, defaults will be used.');
    }

    // so we don't have to import config everywhere
    global.__TEST__ = config.globals.__TEST__;
    global.__SKIP_AUTH__ = config.globals.__SKIP_AUTH__;
    global.__NODE_ENV__ = config.globals.NODE_ENV;

    // utilities
    const base = (...args) => {
      const baseArgs = [config.path_base].concat([].slice.call(args));
      return path.resolve(...baseArgs);
    };
    config.errorHandlers = errorHandlers;
    config.paths = { base };
    info({ color: 'bold' }, `Config initialized for %${config.env}%`);
    trace(config);
    resolve(config);
  })
);

const getConfig = () => config;

module.exports = { getConfig, initConfig };
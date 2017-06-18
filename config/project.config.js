/* eslint key-spacing:0 spaced-comment:0 */
const path = require('path');
const { debug } = require('debugger-256')('api:config:project');
const argv = require('yargs').argv;
const ip = require('ip');

debug('Creating default configuration.');
// ========================================================
// Default Configuration
// ========================================================
const config = {
  env : process.env.NODE_ENV || 'development',

  // ----------------------------------
  // Project Structure

  // ----------------------------------
  path_base  : path.resolve(__dirname, '..'),
  dir_test   : 'tests',

  // ----------------------------------
  // Server Configuration
  // ----------------------------------
  server_host : ip.address(), // use string 'localhost' to prevent exposure on local network
  server_port : process.env.PORT || 3000,

  // ----------------------------------
  // Database Configuration
  // ----------------------------------
  db_host : process.env.DB_HOST || 'localhost' ,
  db_port : process.env.DB_PORT || 28015,
  db_name : process.env.DB_NAME || 'instrumental',

  // API Configuration
  api_host   : process.env.API_HOST || 'localhost',
  api_port   : process.env.API_PORT || 3001,
  api_secret : 'asjdkfjsdkgh',

  // ----------------------------------
  // Test Configuration
  // ----------------------------------
  coverage_reporters : [
    { type : 'text-summary' },
    { type : 'lcov', dir : 'coverage' }
  ]
};

const initConfig = () => {
  return new Promise(resolve => {

    // ------------------------------------
    // Environment
    // ------------------------------------
    // N.B.: globals added here must _also_ be added to .eslintrc
    config.globals = {
      'NODE_ENV'     : config.env,
      '__DEV__'      : config.env === 'development',
      '__PROD__'     : config.env === 'production',
      '__TEST__'     : config.env === 'test',
      '__COVERAGE__' : !argv.watch && config.env === 'test',
      '__BASENAME__' : JSON.stringify(process.env.BASENAME || ''),
      '__SKIP_AUTH__' : config.env !== 'production'
    };

    // ========================================================
    // Environment Configuration
    // ========================================================
    debug(`Looking for environment overrides for NODE_ENV "${config.env}".`);
    const environments = require('./environments.config');
    const overrides = environments[config.env];
    if (overrides) {
      debug('Found overrides, applying to default configuration.');
      Object.assign(config, overrides(config));
    } else {
      debug('No environment overrides found, defaults will be used.');
    }

    // so we don't have to import config everywhere
    global.__TEST__ = config.globals.__TEST__;
    global.__SKIP_AUTH__ = config.globals.__SKIP_AUTH__;
    global.__NODE_ENV__ = config.globals.NODE_ENV;

    // ------------------------------------
    // Utilities
    // ------------------------------------
    const base = () => {
      const args = [config.path_base].concat([].slice.call(arguments));
      return path.resolve.apply(path, args);
    }

    config.errorHandlers = require('../lib/utils/error');

    config.paths = {
      base   : base
    };

    debug('Config initialized', config);
    resolve(config);
  });
};

const getConfig = () => config;

module.exports = { getConfig, initConfig };

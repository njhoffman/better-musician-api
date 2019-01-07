/* eslint key-spacing:0 spaced-comment:0 */
const _ = require('lodash');
const path = require('path');
const appRoot = require('app-root-path');
const { argv } = require('yargs');
const errorHandlers = require('lib/utils/error');
const initLogger = require('lib/utils/logger');
const environments = require('./environments');


// default/base configuration, can be overridden with environment files
const config = {
  appName: 'better-musician-api',
  nameSpace: 'bmusic-api',
  env : process.env.NODE_ENV || 'development',
  // pathBase: path.resolve(__dirname, '..'),
  pathBase: `${appRoot}`,
  pathTest: 'test',

  dbHost : process.env.DB_HOST || 'localhost',
  dbPort : process.env.DB_PORT || 28015,
  dbName : process.env.DB_NAME || 'better_musician',

  apiHost   : process.env.API_HOST || '0.0.0.0',
  apiPort   : process.env.API_PORT || 3001,

  API_SECRET : 'asjdkfjsdkgh',

  changeLog: {
    outputDir: `${appRoot}/docs/changelogs`,
    tagsDir: `${appRoot}/reports/tags`,
    // automatically run changelog script when version bumped
    bump: {
      major: true,
      minor: true
    },
    sections: {
      summary: true,
      commits: true,
      files: true,
      depsDiff: true,
      depsOutdated: true,
      tests: true,
      coverage: true,
      annotations: true,
    }
  }
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
      __SKIP_AUTH__ : config.env !== 'production',
      __APP_NAME__  : config.appName,
      __APP_NS__    : config.nameSpace
    };

    // so we don't have to import config everywhere
    _.merge(global, {
      __APP_NS__    : config.globals.__APP_NS__,
      __APP_NAME__  : config.globals.__APP_NAME__,
      __TEST__      : config.globals.__TEST__,
      __SKIP_AUTH__ : config.globals.__SKIP_AUTH__,
      __NODE_ENV__  : config.globals.NODE_ENV,
    });


    const { trace, debug, info } = initLogger('config');
    debug(`Looking for environment overrides for NODE_ENV %${config.env}%`);
    const overrides = environments[config.env];
    if (overrides) {
      debug(overrides(config), 'Found overrides, applying to default configuration.');
      Object.assign(config, overrides(config));
    } else {
      debug('No environment overrides found, defaults will be used.');
    }

    // utilities
    const base = (...args) => {
      const baseArgs = [config.pathBase].concat([].slice.call(args));
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

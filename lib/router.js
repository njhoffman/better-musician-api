const StatsD = require('node-statsd');
const morgan = require('morgan');
const passport = require('passport');

const { version } = require('../package.json');
const configPassport = require('./utils/passport');
const { morganOutput, padRight } = require('./utils/server.utils');
const { routeError } = require('./utils/error');

const { info, debug } = require('./utils/logger')('api:router');

const sdc = new StatsD();

const initRouting = (app, models) => {
  app.use((req, res, next) => {
    const ua = req.headers['user-agent'] ? req.headers['user-agent'] : '';
    req._ctx = 'html';
    if (ua.indexOf('curl') !== -1) {
      req._ctx = 'text';
    } else if (ua.indexOf('superagent') !== -1) {
      req._ctx = 'json';
    }
    sdc.increment('api_request');
    next();
  });

  // any response/header rewriting that happens after here won't get logged
  app.use(morgan(morganOutput));
  configPassport(passport, models);

  app.use('/version', (req, res) => {
    res.send({ version });
  });

  // TODO: crawl directory, use dynamic import instead of require
  ['artists', 'users', 'songs', 'fields', 'admin'].forEach(basePath => {
    // babel-loader returns object, add babel-plugin-add-module-exports if needed elsewhere

    /* eslint-disable global-require, import/no-dynamic-require */
    const route = require(`./routes/${basePath}`)(passport, models);
    /* eslint-enable global-require, import/no-dynamic-require */

    info(`/${basePath}: ${route.stack.length} routes loaded`);
    route.stack.forEach(stack => (
      Object.keys(stack.route.methods).forEach(method => {
        debug(`  ${padRight(method.toUpperCase(), 5)} /${basePath}${stack.route.path}`);
      })
    ));
    app.use(`/${basePath}`, route);
  });

  app.use(routeError);
};

module.exports = initRouting;

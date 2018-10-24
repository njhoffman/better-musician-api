const StatsD = require('node-statsd');
const morgan = require('morgan');
const passport = require('passport');

const { version } = require('../package.json');
const configPassport = require('./utils/passport');
const { morganOutput, padRight } = require('./utils/server.utils');
const { routeError } = require('./utils/error');

const { info, debug, trace } = require('./utils/logger')('api:router');

const sdc = new StatsD();

const initRouting = (app, models) => {
  app.use((req, res, next) => {
    const ua = req.headers['user-agent'] ? req.headers['user-agent'] : '';
    req._ctx = ua.indexOf('curl') !== -1 ? 'text'
      : ua.indexOf('superagent') !== -1 ? 'json'
      : 'html';
    sdc.increment('api_request');
    next();
  });

  // any response/header rewriting that happens after here won't get logged
  app.use(morgan(morganOutput));
  configPassport(passport, models);

  app.use('/version', (req, res) => {
    res.send({ version });
  });

  // TODO: crawl directory
  ['artists', 'users', 'songs', 'fields', 'admin'].forEach(basePath => {
    // babel-loader returns object, add babel-plugin-add-module-exports if needed elsewhere
    const route = require(`./routes/${basePath}`).default(passport, models);
    info(`/${basePath}: ${route.stack.length} routes loaded`);
    route.stack.forEach(stack =>
      Object.keys(stack.route.methods).forEach(method =>
        debug(`  ${padRight(method.toUpperCase(), 5)} /${basePath}${stack.route.path}`)
      )
    );
    app.use(`/${basePath}`, route);
  });

  app.use(routeError);
};

module.exports = initRouting;

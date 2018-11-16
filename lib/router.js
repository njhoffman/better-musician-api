const StatsD = require('node-statsd');
const morgan = require('morgan');
const passport = require('passport');

const { version } = require('../package.json');
const { morganOutput, padRight } = require('./utils/server.utils');
const { routeError } = require('./utils/error');

const { info, debug } = require('./utils/logger')('router');

const sdc = new StatsD();

/* eslint-disable global-require, import/no-dynamic-require */
const baseNames =  ['admin', 'users', 'fields', 'artists', 'songs'];
const baseRoutes = baseNames
  .map(basePath => {
    const loc = `./routes/${basePath}`;
    delete require.cache[require.resolve(loc)];
    const initRoute = require(loc);
    return ({ basePath, initRoute });
  });
/* eslint-enable global-require, import/no-dynamic-require */


const initRouting = (app) => {
  info(`Initializing routing for base routes: ${baseNames.join(', ')}`);
  const initBaseRoute = ({ initRoute, basePath }) => {
    const route = initRoute(passport);
    const subRoutes = {};
    route.stack.forEach(stack => {
      const { path } = stack.route;
      Object.keys(stack.route.methods).forEach(method => {
        if (!subRoutes[path] || subRoutes[path].indexOf(method) === -1) {
          debug(`  ${padRight(method.toUpperCase(), 5)} /${basePath}${stack.route.path}`);
          subRoutes[path] = [].concat(subRoutes[path]).push(method);
        }
      });
    });
    info(`/${basePath}: ${Object.keys(subRoutes).length} sub-routes loaded`);
    app.use(`/${basePath}`, route);
  };

  // any response/header rewriting that happens after here won't get logged
  app.use(morgan(morganOutput));

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

  app.use('/version', (req, res) => {
    res.send({ version });
  });


  // all responses should be json { status: 200, data };
  // data structure:
  //   update  { changed: { new, old, delta }, fields };
  //   add { fields };
  //   delete [ids]
  //   query { fields }

  baseRoutes.forEach(initBaseRoute);

  app.use(routeError);
};

module.exports = initRouting;

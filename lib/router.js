const morgan = require('morgan');
const passport = require('passport');

const { morganOutput, padRight, getDirectories } = require('lib/utils/server.utils');
const { routeError: unexpectedRouteError } = require('lib/utils/error');
const { respondSuccess, respondError } = require('lib/utils/router.utils');
const initLogger = require('lib/utils/logger');
const { version } = require('../package.json');

/* eslint-disable global-require, import/no-dynamic-require */
const baseNames = getDirectories(`${__dirname}/routes`)
  .map(dir => dir.split('/').pop());

const baseRoutes = baseNames
  .map(basePath => {
    const loc = `./routes/${basePath}`;
    delete require.cache[require.resolve(loc)];
    const initRoute = require(loc);
    return ({ basePath, initRoute });
  });
/* eslint-enable global-require, import/no-dynamic-require */

const initBaseRoute = ({ initRoute, basePath }, app) => {
  const { info, debug } = initLogger('router');
  const route = initRoute(passport, respondSuccess, respondError);
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

const initRouting = (app) => {
  const { info } = initLogger('router');
  info(`Initializing routing for base routes: ${baseNames.join(', ')}`);

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
    next();
  });

  app.use('/version', (req, res) => {
    res.send({ version });
  });

  baseRoutes.forEach(baseRoute => initBaseRoute(baseRoute, app));

  app.use(unexpectedRouteError);
};

module.exports = initRouting;

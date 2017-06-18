const StatsD = require('node-statsd');
const morgan = require('morgan');
const passport = require('passport');

const { version } = require('../package.json');
const configPassport = require('./utils/passport');
const { morganOutput } = require('./utils/server.utils');
const { routeError } = require('./utils/error');

const {
  userRoutes,
  songRoutes,
  fieldRoutes,
  adminRoutes
} = require('./routes');

const sdc = new StatsD();

const initRouting = (app, models) => {
  app.use((req, res, next) => {
    const ua = req.headers['user-agent'] ? req.headers['user-agent'] : '';
    req._format = ua.indexOf('curl') !== -1 ? 'text'
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
  app.use('/users', userRoutes(passport, models));
  app.use('/songs', songRoutes(passport, models));
  app.use('/fields', fieldRoutes(passport, models));
  app.use('/admin', adminRoutes(passport, models));

  // route error handler, must be last
  app.use(routeError);
};

module.exports = initRouting;

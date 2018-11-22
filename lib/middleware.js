const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const responseTime = require('response-time');
const compression = require('compression');


const { info } = require('./utils/logger')('middleware');

const {
  responseLog,
  initRequestMetadata,
  initModelMetadata,
  requestLog,
  allowCrossDomain
} = require('./utils/server.utils.js');

const initMiddleware = (app, passport, models) => {
  info('Initializing middleware ...');
  app.use(compression());
  app.use(multer().array());
  app.use(cookieParser('somesecret'));
  app.use(bodyParser.json({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(initRequestMetadata);
  app.use(initModelMetadata(models));
  app.use(requestLog);
  app.use(allowCrossDomain);
  // app.use(passport.session());
  app.use(responseTime(responseLog));

  return Promise.resolve(app);
};

module.exports = initMiddleware;

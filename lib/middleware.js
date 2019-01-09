const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const compression = require('compression');
const initLogger = require('lib/utils/logger');

const {
  initRequestMetadata,
  initModelMetadata,
  requestLog,
  allowCrossDomain
} = require('./utils/server.utils.js');

const initMiddleware = (app, passport, models) => {
  const { info } = initLogger('middleware');
  info('Initializing middleware ...');
  app.use(compression());
  app.use(multer().array());
  app.use(cookieParser());
  app.use(bodyParser.json({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(initRequestMetadata);
  app.use(initModelMetadata(models));
  app.use(requestLog);
  app.use(allowCrossDomain);
  // app.use(passport.session());

  return Promise.resolve(app);
};

module.exports = initMiddleware;

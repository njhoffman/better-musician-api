const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const {
  requestOutput,
  allowCrossDomain
} = require('./utils/server.utils.js');

const initMiddleware = (app) => {
  app.use(multer().array());
  app.use(cookieParser('somesecret'));
  app.use(bodyParser.json({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(requestOutput);
  app.use(allowCrossDomain);
  app.use(passport.initialize());
  return Promise.resolve(app);
};

module.exports = initMiddleware;

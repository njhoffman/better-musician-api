const StatsD = require('node-statsd');
const _ = require('lodash');

const sdc = new StatsD();

// auth strategies return success to first defined route if done is passed truthy value in 2nd parameter
//   -expects 2nd parameter success value to be an object to be assigned to req.user
//   -will return error to 2nd defined route

const jwtStrategy = (req, payload, done) => {
  const { User } = req._models_;
  if (!_.has(payload, 'id')) {
    req.logger.warn({ payload }, 'JWT authentication failure: missing payload.id');
    return done(null, false);
  }
  return User.findById(payload.id)
    .then(fields => {
      if (_.isObject(fields)) {
        sdc.increment('api_auth_jwt_success');
        req.logger = req.logger.child({ _requestUser: fields.email, subsystem: 'passport:strategies' });
        req.logger.info(`JWT authentication success for user: ${fields.email}`);
        return done(null, fields);
      }
      sdc.increment('api_auth_jwt_failed');
      req.logger.warn(`JWT authentication failed, account for id:${payload.id} not found`);
      return done(null);
    });
};

const loginStrategy = (req, email, password, done) => {
  // TODO: switch this to findModelByField
  const { User } = req._models_;

  // const reqUserKeys = [
  //   '_requestId', '_requestIp', '_requestLocation', '_requestUser', '_requestUserAgent'
  // ];
  // const reqFields = req.logger.parent.fields;
  // const requestParams = _.pick(reqFields, reqUserKeys);
  const { debug, info } = req.logger.child({ subsystem: 'passport:strategies' });

  User.modelByField({ email })
    .then(foundUser => {
      if (foundUser.length === 0) {
        debug(`No found user: ${email}`);
        sdc.increment('api_login_failed');
        return done(null, false);
      }

      info(
        { _trace: { userFields: foundUser.cleanFields } },
        `Login attempt - found user ${email}, trying password: ${password}`
      );

      if (!foundUser.validPassword(password)) {
        info(`Invalid password: ${password}`);
        sdc.increment('api_login_failed');
        // TODO: save event
        // return foundUser.saveEvent('login_failure', requestParams);
        return done(null, false);
      }
      sdc.increment('api_login_success');

      req.logger = req.logger.child({ _requestUser: email, subsystem: 'passport:strategies' });
      req.logger.info({ _debug: foundUser.cleanFields }, `Login authentication success for user: ${email}`);
      return done(null, foundUser.cleanFields);
      // TODO: save event
      // return foundUser.saveEvent('login_success', requestParams);
    });
};

const signupStrategy = (req, email, password, done) => {
  // TODO: refactor this
  const { User } = req._models_;
  const { info } = req.logger.child({ subsystem: 'passport:strategies' });
  User.modelByField({ email })
    .then(existingUser => {
      if (existingUser.length !== 0) {
        info(`local signup failed for: ${email}, email already exists`);
        sdc.increment('api_signup_failed');
        return done(null, false);
      }
      info(`local signup successful: ${email}`);
      sdc.increment('api_signup');
      return User.save({ email, password: User.generateHash(password) });
    })
    .then((results = {}) => {
      const { records } = results;
      return done(null, records);
    });
};

module.exports = {
  jwtStrategy,
  loginStrategy,
  signupStrategy
};

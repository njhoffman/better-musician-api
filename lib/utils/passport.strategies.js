const StatsD = require('node-statsd');
const _ = require('lodash');

const sdc = new StatsD();

const jwtStrategy = (req, payload, done) => {
  const { User } = req._models_;
  User.findById(payload.id)
    .then(fields => {
      if (_.isObject(fields)) {
        sdc.increment('api_auth_jwt_success');
        req.logger = req.logger.child({ _requestUser: fields.email, subsystem: 'passport:strategies' });
        req.logger.info(`JWT authentication success for user: ${fields.email}`);
        req.user.email = fields.email;
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

  const reqUserKeys = [
    '_requestId', '_requestIp', '_requestLocation', '_requestUser', '_requestUserAgent'
  ];
  const reqFields = req.logger.parent.fields;
  const requestParams = _.pick(reqFields, reqUserKeys);
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
        return foundUser.saveEvent('login_failure', requestParams);
      }
      sdc.increment('api_login_success');

      req.logger = req.logger.child({ _requestUser: email, subsystem: 'passport:strategies' });
      req.logger.info({ _trace: foundUser.cleanFields }, `Login authentication success for user: ${email}`);
      return foundUser.saveEvent('login_success', requestParams);
    })
    .then(res => {
      done(null, res.fields);
    });
};

const signupStrategy = (req, email, password, done) => {
  // TODO: refactor this
  const { User } = req._models_;
  const { info } = req.logger.child({ subsystem: 'passport:strategies' });
  User.modelByField({ email })
    .then(user => {
      if (user.length !== 0) {
        info(`local signup failed for: ${email}`);
        sdc.increment('api_signup_failed');
        return done(null, false);
      }
      info(`local signup successful: ${email}`);
      sdc.increment('api_signup');
      const newUser = new User({
        email,
        password: User.generateHash(password)
      });
      return newUser.save();
    })
    .then(userFields => (
      done(null, userFields)
    ));
};

module.exports = {
  jwtStrategy,
  loginStrategy,
  signupStrategy
};

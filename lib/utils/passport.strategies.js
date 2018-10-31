const StatsD = require('node-statsd');
const _ = require('lodash');

const getModels = require('lib/models');
const { info, warn, debug, trace } = require('./logger')('api:passport:strategies');

const sdc = new StatsD();

const jwtStrategy = (payload, done) => {
  const { User } = getModels();
  User.findById(payload.id)
    .then(user => {
      if (_.isObject(user)) {
        sdc.increment('api_auth_jwt_success');
        trace(`JWT Auth success for user id: ${user.id}, email: ${user.email}`);
        return done(null, user);
      }
      sdc.increment('api_auth_jwt_failed');
      warn(`JWT Auth account for id:${payload.id} not found`);
      return done(null);
    });
};

const loginStrategy = (req, email, password, done) => {
  // TODO: switch this to findModelByField
  const { User } = getModels();
  User.modelByField({ email })
    .then(user => {
      if (user.length === 0) {
        debug(`No found user: ${email}`);
        sdc.increment('api_login_failed');
        return done(null, false);
      }

      info({ userFields: user.cleanFields }, 'Found user');
      // needlessly creating a new model here
      if (!user.validPassword(password)) {
        info(`Invalid password: ${password}`);
        sdc.increment('api_login_failed');
        return done(null, false);
      }
      sdc.increment('api_login_success');
      return done(null, user.cleanFields);
    });
};

const signupStrategy = (req, email, password, done) => {
  // TODO: refactor this
  const { User } = getModels();
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

const getModels = require('../models/');
const StatsD = require('node-statsd');
const { isObject } = require('lodash');

const { log, warn, debug } = require('debugger-256')('api:passport:strategies');
const sdc = new StatsD();

const jwtStrategy = (payload, done) => {
  const { User } = getModels();
  User.findById(payload.id).then(user => {
    if (isObject(user)) {
      sdc.increment('api_auth_jwt_success');
      log(`JWT Auth success for  ${payload.id}`);
      return done(null, {
        email: user['email'],
        id: user['id'],
        points: user['points']
      });
    } else {
      sdc.increment('api_auth_jwt_failed');
      warn(`JWT Auth account for ${payload.id} not found`);
      return done(null);
    }
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
      log('Found user', user.cleanFields);
      // needlessly creating a new model here
      if (!user.validPassword(password)) {
        log(`Invalid password: ${password}`);
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
        log(`local signup failed for: ${email}`);
        sdc.increment('api_signup_failed');
        done(null, false);
      } else {
        log(`local signup successful: ${email}`);
        sdc.increment('api_signup');
        const newUser = new User({
          email: email,
          password: User.generateHash(password)
        });
        return newUser.save();
      }
    }).then(userFields => done(null, userFields));
};

module.exports = {
  jwtStrategy,
  loginStrategy,
  signupStrategy
};

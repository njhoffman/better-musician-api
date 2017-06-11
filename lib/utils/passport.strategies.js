const getModels = require('../models/');
const StatsD = require('node-statsd');
const { log, debug } = require('debugger-256')('api:passport:strategies');
const sdc = new StatsD();

const isTestUser = (newUser) => {
  // TODO: put this in user model
  return parseInt(newUser.fields.id) === 0;
};

export const jwtStrategy = (payload, done) => {
  const { User } = getModels();
  User.findById(payload.id).then(user => {
    if (user) {
      sdc.increment('api_auth_jwt_success');
      return done(null, {
        email: user['email'],
        id: user['id'],
        points: user['points']
      });
    } else {
      sdc.increment('api_auth_jwt_failed');
      return done(null);
    }
  });
};

export const loginStrategy = (req, email, password, done) => {
  // TODO: switch this to findModelByField
  const { User } = getModels();
  User.findByField({ email })
    .then(user => {
      if (!user) {
        debug(`No found user: ${email}`);
        sdc.increment('api_login_failed');
        return done(null, false);
      }
      log('Found user', user);
      // needlessly creating a new model here
      const newUser = new User(user);
      if (!isTestUser(newUser) && !newUser.validPassword(password)) {
        log(`Invalid password: ${password}`);
        sdc.increment('api_login_failed');
        return done(null, false);
      }
      sdc.increment('api_login_success');
      return done(null, newUser.fields);
    });
};

export const signupStrategy = (req, email, password, done) => {
  // TODO: refactor this
  const { User } = getModels();
  User.findByField({ email })
    .then(user => {
      if (user) {
        sdc.increment('api_signup_failed');
        done(null, false);
      } else {
        log('local signup successful: ' + email);
        sdc.increment('api_signup');
        const newUser = new User({
          email: email,
          password: User.generateHash(password)
        });
        return newUser.save();
      }
    }).then(newUser => {
      if (newUser) {
        done(null, newUser.fields);
      }
    });
};

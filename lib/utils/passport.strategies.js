const { User } = require('../models/');
const StatsD = require('node-statsd');
const { log, debug } = require('debugger-256')('api:passport:strategies');
const sdc = new StatsD();

export const jwtStrategy = (payload, done) => {
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
  User.findByField({ email })
    .then(user => {
      if (!user) {
        debug(`No found user: ${email}`);
        sdc.increment('api_login_failed');
        return done(null, false);
      }
      log('Found user', user);
      const newUser = new User(user[0]);
      if (!newUser.validPassword(password)) {
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
  User.findByField({ email })
    .then(user => {
      if (user[0]) {
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

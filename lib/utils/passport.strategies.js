const StatsD = require('node-statsd');
const sdc = new StatsD();
const { log } = require('debugger-256')('api:passport:strategies');

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
        sdc.increment('api_login_failed');
        done(null, false);
      }
      log('trying to log in', user);
      const newUser = new User(user[0]);
      if (!newUser.validPassword(password)) {
        log('invalid password', password);
        sdc.increment('api_login_failed');
        done(null, false);
      }
      sdc.increment('api_login_success');
      done(null, newUser.fields);
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

const { map } = require('lodash');
const passportLocal = require('passport-local');
const { ExtractJwt, Strategy } = require('passport-jwt');
const { info, trace } = require('./logger')('api:passport');

const { getConfig } = require('../../config/project.config');
const { signupStrategy, loginStrategy, jwtStrategy } = require('./passport.strategies');

const LocalStrategy = passportLocal.Strategy;

const cookieExtractor = (req) => {
  // redux auth stores in cookie, authorization header won't be sent from direct api calls
  if (req.cookies && req.cookies.authHeaders) {
    let jwt;
    try {
      jwt = JSON.parse(req.cookies.authHeaders);
    } catch (e) {
      return false;
    }
    return jwt['access-token'];
  }
  return false;
};

const extractors = [ExtractJwt.fromAuthHeaderWithScheme('Bearer'), cookieExtractor];

const configPassport = (passport, { User }) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    info('deserializing user', id);
    User.findById(id)
      .then((user) => {
        done(null, ...{ ...user, uid: user.id });
      })
      .catch(done);
  });

  passport.use(
    'jwt',
    new Strategy({
      secretOrKey: getConfig().API_SECRET,
      jwtFromRequest: ExtractJwt.fromExtractors(extractors)
    }, jwtStrategy)
  );

  passport.use(
    'local-signup',
    new LocalStrategy({
      usernameField: 'email-sign-up-email',
      passwordField: 'email-sign-up-password',
      passReqToCallback: true
    }, signupStrategy)
  );

  passport.use(
    'local-login',
    new LocalStrategy({
      usernameField:'email-sign-in-email',
      passwordField:'email-sign-in-password',
      passReqToCallback: true
    }, loginStrategy)
  );

  User.all.then(users => {
    trace({ users: map(users, 'email') }, 'Existing users');
    return users;
  });
};

module.exports = configPassport;

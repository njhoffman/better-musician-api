const { map } = require('lodash');
const passportLocal = require('passport-local');
const { ExtractJwt, Strategy } = require('passport-jwt');
// const { log, trace } = require('debugger-256')('api:passport');
const log = console.log;
const trace = console.log;

const { getConfig } = require('../../config/project.config');
const { signupStrategy, loginStrategy, jwtStrategy } = require('./passport.strategies');

var LocalStrategy = passportLocal.Strategy;

const cookieExtractor = (req) => {
  // redux auth stores in cookie, authorization header won't be sent from direct api calls
  if (req.cookies && req.cookies.authHeaders) {
    let jwt;
    try { jwt = JSON.parse(req.cookies.authHeaders); }
    catch (e) { return false; }
    return jwt['access-token'];
  }
};
const extractors = [ ExtractJwt.fromAuthHeaderWithScheme('Bearer'), cookieExtractor ];

const configPassport = (passport, { User }) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    log('deserializing user', id);
    User.findById(id).then((user) => {
      user.uid = user.id;
      done(null, user);
    }).catch((err) => {
      done(err);
    });
  });

  passport.use('jwt', new Strategy({
    secretOrKey:    getConfig().api_secret,
    jwtFromRequest: ExtractJwt.fromExtractors(extractors) },
    jwtStrategy
  ));

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email-sign-up-email',
    passwordField: 'email-sign-up-password',
    passReqToCallback: true },
    signupStrategy
  ));

  passport.use('local-login', new LocalStrategy({
    usernameField:'email-sign-in-email',
    passwordField:'email-sign-in-password',
    passReqToCallback: true },
    loginStrategy
  ));

  User.all.then(users => {
    trace('Users', map(users, 'email'));
  });
}

module.exports = configPassport;

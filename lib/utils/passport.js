import passportLocal from 'passport-local';
import { User } from '../models/';
import config from '../../config/project.config';
import { map } from 'lodash';

  const { ExtractJwt, Strategy } = require('passport-jwt');
const { signupStrategy, loginStrategy, jwtStrategy } = require('./passport.strategies');
const { log, trace } = require('debugger-256')('api:passport');

var LocalStrategy = passportLocal.Strategy;

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
};
const extractors = [ ExtractJwt.fromAuthHeaderWithScheme('Bearer'), cookieExtractor ];

export default function configPassport (passport) {
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
    secretOrKey:    config.api_secret,
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

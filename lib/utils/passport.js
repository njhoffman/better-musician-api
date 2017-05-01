import passportLocal from 'passport-local';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../models/';
import config from '../../config/project.config';

const StatsD = require('node-statsd');
const sdc = new StatsD();

const { log } = require('debugger-256')('api:passport');

var LocalStrategy = passportLocal.Strategy;

export default function configPassport(passport) {
  passport.serializeUser( (user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser( (id, done) => {
    log("deserializing user %s", id);
    User.findById(id).then( (user) => {
      user.uid = user.id;
      done(null, user);
    }).catch((err) => {
      done(err);
    });
  });

  const cookieExtractor = (req) => {
    // redux auth stores in cookie, authorization header won't be sent from direct api calls
    if (req.cookies && req.cookies.authHeaders) {
      let jwt;
      try {
        jwt = JSON.parse(req.cookies.authHeaders);
      } catch(e) {
        return false;
      }
      return jwt['access-token'];
    }
  }
  const extractors = [ ExtractJwt.fromAuthHeaderWithScheme('Bearer'), cookieExtractor ];

  passport.use('jwt', new Strategy({
    secretOrKey:    config.api_secret,
    jwtFromRequest: ExtractJwt.fromExtractors(extractors) },
    (payload, done) => {
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
    }
  ));

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email-sign-up-email',
    passwordField: 'email-sign-up-password',
    passReqToCallback: true},
    (req, email, password, done) => {
      // TODO: refactor this
      User.findByField({ email })
        .then(user => {
          if (user[0]) {
            sdc.increment('api_signup_failed');
            done(null, false);
          } else {
            log('local signup successful: ' +  email);
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
    }
  ));

  passport.use('local-login', new LocalStrategy({
    usernameField:'email-sign-in-email',
    passwordField:'email-sign-in-password',
    passReqToCallback: true},
    (req, email, password, done) => {
      User.findByField({ email })
        .then(user => {
          if(!user){
            sdc.increment('api_login_failed');
            done(null, false);
          }
          log('trying to log in %o', user);
          const newUser = new User(user[0]);
          if(!newUser.validPassword(password)){
            log("invalid password %s", password);
            sdc.increment('api_login_failed');
            done(null, false);
          }
          sdc.increment('api_login_success');
          done(null, newUser.fields);
        });
    }
  ));

  User.all.then(users => {
    users.forEach(function(user) {
      log('user', user.email);
    });
  });
}

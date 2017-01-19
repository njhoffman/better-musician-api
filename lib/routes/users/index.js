const router = require('express').Router();
const createToken = require("jsonwebtoken").sign;
const config = require("../../../config/project.config");
const User = require('../../models/User');

const debug = require("debug")("api:users");

export default function (passport) {

  router.post('/register',
    passport.authenticate('local-signup', { failWithError: true, session: false }),
    (req, res) => {
      const token = createToken(req.user, config.api_secret);
      debug('Registered user: %O  \n token: %O', req.user.id, token);
      req.user.uid = req.user.email;
      res.set('access-token', token);
      res.set('token-type', 'JWT');
      res.set('uid', req.user.uid);
      // app.set('expiry', 6666666);
      debug("created user: %O", req.user);
      res.json({
        data: req.user
      });
    }, (err, req, res, next) => {
      if (err.status === 401) {
        err.message = "An account with that email is already registered";
        res.status(err.status).send({ errors: [err.message] });
      } else {
        throw new Error(err.message);
      }
    });

  router.post('/login',
    passport.authenticate('local-login', { failWithError: true, session: false }),
    (req, res) => {
      debug('User %o logged in', req.user);
      res.json({
        status: 'ok',
        user: req.user
      });
    }, (err, req, res, next) => {
      debug("Passport Error: %s %s", err.name, err.message);
      res.status(err.status).send({ errors: [err.message] });
    });

  router.post('/update',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      User.modelByField({ email: req.user.email })
        .then(user => {
          debug('I am %O', user);
          if (!user) {
            return res.json({user:null});
          } else if (req.body) {
            user.save(req.body)
              .then(savedUser => {
                debug('WE DID IT %O', savedUser);
                return res.json({
                  user: savedUser
                })
              });
          }
          return res.json({
            user: user
          });
        });
    });

  router.get('/validate_token',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      debug(`User ${req.user.email} logged in`);
      User.modelByField({ email: req.user.email })
        .then(user => {
          debug('I am %O', user);
          if (!user) {
            return res.json({user:null});
          } else {
            return res.json({ status: 'ok', data: user });
          }
        });
    });

  router.get('/me',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      debug('Me is %O', req.user);
      if (!req.user) {
        res.json({user:null});
      } else {
        res.json({
          user: req.user
        });
      }
    });

  router.all('/logout',
    (req, res) => {
      req.logout();
      res.json({status: 'ok'});
    }
  );

  return router;

  /*
      # Facebook login routes
      app.get '/auth/facebook', passport.authenticate 'facebook', æ scope: 'email'
      app.get '/auth/facebook/callback', passport.authenticate 'facebook', æ successRedirect : '/profile',  failureRedirect : '/' å

      # Twitter login routes
      app.get '/auth/twitter', passport.authenticate 'twitter'
      app.get '/auth/twitter/callback', passport.authenticate 'twitter', æ successRedirect : '/profile',  failureRedirect : '/' å

      # Google login routes
      app.get '/auth/google', passport.authenticate 'google', æ scope: Æ'profile', 'email'Åå
      app.get '/auth/google/callback', passport.authenticate 'google', æ successRedirect : '/profile',  failureRedirect : '/' å
  */

}

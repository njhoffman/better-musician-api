const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;
const config = require('../../../config/project.config');
const User = require('../../models/User');
const SongModel = require('../../models/Song');
const FieldModel = require('../../models/Field');

const { log } = require('debugger-256')('api:route:user');

export default function (passport) {
  router.post('/register',
    passport.authenticate('local-signup', { failWithError: true, session: false }),
    (req, res) => {
      const token = createToken(req.user, config.api_secret);
      log('registered user ' + req.user.id, 'token', token);
      req.user.uid = req.user.email;
      res.set('access-token', token);
      res.set('token-type', 'JWT');
      res.set('uid', req.user.uid);
      // app.set('expiry', 6666666);
      return FieldModel.generate(4, { user: req.user.id })
        .then(results => {
          if (results.errors === 0) {
            return SongModel.generate(35, { user: req.user.id }, results.generated_keys);
          } else {
            throw new Error(results.first_error);
          }
        }).then(results => {
          if (results.errors === 0) {
            res.json({
              status: 200,
              data: req.user
            });
          } else {
            throw new Error(results.first_error);
          }
        });
    }, (err, req, res, next) => {
      if (err.status === 401) {
        err.message = 'An account with that email is already registered';
        res.status(err.status).send({ errors: [err.message] });
      } else {
        throw new Error(err.message);
      }
    });

  router.post('/login',
    passport.authenticate('local-login', { failWithError: true, session: false }),
    (req, res) => {
      const token = createToken(req.user, config.api_secret);
      log('user logged in' + req.user.id, 'token', token);
      req.user.uid = req.user.email;
      res.set('access-token', token);
      res.set('token-type', 'JWT');
      res.set('uid', req.user.uid);
      // app.set('expiry', 6666666);
      res.json({
        data: req.user,
        status: 200
      });
    }, (err, req, res, next) => {
      log('Passport Error:', err.name, err.message);
      res.status(err.status).send({ errors: [err.message] });
    });

  router.post('/update',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      User.modelByField({ email: req.user.email })
        .then(user => {
          if (!user) {
            return res.json({ user:null });
          } else if (req.body) {
            return user.save(req.body);
          }
          return res.json({
            status: 200,
            data: user.fields
          });
        }).then(savedUser => {
          return res.json({
            status: 200,
            data: savedUser.fields
          });
        });
    });

  router.get('/validate_token',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      log(`User logged in`, req.user);
      User.modelByField({ email: req.user.email })
        .then(user => {
          log('user validated', user);
          if (!user) {
            return res.json({ user:null });
          } else {
            return res.json({ status: 200, data: user.fields });
          }
        });
    });

  router.get('/me',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      log('Me is ...', req.user);
      if (!req.user) {
        res.json({ user:null });
      } else {
        res.json({
          status: 200,
          user: req.user
        });
      }
    });

  router.all('/logout',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      User.modelById(req.user.id)
        .then(user => {
          log('logging out, dont forget to save', user);
          req.logout();
          res.json({ status: 200, data: user.fields });
        });
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

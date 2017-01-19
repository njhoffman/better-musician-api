const router = require('express').Router();
const createToken = require("jsonwebtoken").sign;
const SongModel = require('../../models').Song;

const debug = require("debug")("api:songs");

export default function (passport) {


  router.get('/',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res) => {
      const uid = req.user.id;
      debug(`Songs User ${req.user.email} logged in`);
      SongModel.findRelatedByUserId(uid)
        .then(tables => {
          res.json({
            status: 'ok',
            data: {
              tables: tables
            }
          });
        });

    });

  router.post('/add',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res) => {
      debug(`User ${req.user.email} logged in`);
      res.json({
        status: 'ok',
        data: req.user
      });
    });

  router.post('/delete',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res) => {
      res.json({status: 'ok'});
    });


  router.get('/generate/:number*?',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res, next) => {
      const uid = req.user.id;
      const num = req.params.number ? req.params.number : 5;
      SongModel.generate(num, { user: uid })
        .then(results => {
          if (results.errors === 0) {
            res.json({status: 'ok'});
          } else {
            throw new Error(results.first_error);
          }
        }).catch(next);
    });

  router.get('/empty',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res, next) => {
      const uid = req.user.id;
      const num = req.params.number ? req.params.number : 5;
      SongModel.generate(num, { user: uid })
        .then(results => {
          if (results.errors === 0) {
            res.json({status: 'ok'});
          } else {
            throw new Error(results.first_error);
          }
        }).catch(next);
    });

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

const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;
const SongModel = require('../../models').Song;

const { info, log } = require('debugger-256')('api:songs');

export default function (passport) {
  // fetch songs for authenticated users
  router.get('/',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res) => {
      const uid = req.user.id;
      info(`Songs User ${req.user.email} logged in`);
      SongModel.findRelatedByUserId(uid)
        .then(tables => {
          res.json({
            status: 200,
            data: {
              tables: tables
            }
          });
        });
    });

  router.post('/add',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res) => {
      res.json({
        status: 200,
        data: req.user
      });
    });

  router.post('/delete',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res) => {
      res.json({ status: 200 });
    });

  router.get('/generate/:number*?',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res, next) => {
      const uid = req.user.id;
      const num = req.params.number ? req.params.number : 5;
      SongModel.generate(num, { user: uid })
        .then(results => {
          if (results.errors === 0) {
            res.json({ status: 200 });
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
            res.json({ status: 200 });
          } else {
            throw new Error(results.first_error);
          }
        }).catch(next);
    });

  return router;
}

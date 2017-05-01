const router = require('express').Router();
const FieldModel = require('../../models/Field');

const { debug } = require("debugger-256")("api:fields");

export default function (passport) {

  router.post('/update',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      FieldModel.modelById(req.user.id)
        .then(field => {
          if (!field) {
            debug(`Could not find field for user: ${req.user.email}`);
            return res.json({ field: null });
          } else if (req.body) {
            field.save(req.body)
              .then(savedField => {
                debug('Saved Field: %O', savedField);
                return res.json({
                  field: savedField
                })
              });
          }
          debug('Nothing to save to field %O', field);
          return res.json({
            field: field
          });
        });
    });

  router.get('/generate',
    passport.authenticate('jwt', { session: false }),
    (req, res, next) => {
      const uid = req.user.id;
      FieldModel.generate(0, { user: uid })
        .then(results => {
          if (results.errors === 0) {
            res.json({status: 200, results: results});
          } else {
            throw new Error(results.first_error);
          }
        }).catch(next);
    });

  router.post('/add',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      const fields = { ...req.body, ...{ user: req.user.id } };
      const Field = new FieldModel(fields);
      Field.add()
        .then(addedField => {
          debug('Added Field: %O', addedField);
          return res.json({
            data: addedField
          })
        });
    });

  router.post('/delete',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
    FieldModel.modelById(req.body.id)
      .then(field => {
        debug('delete field %O', field);
        return field.delete();
      }).then(deletedStatus => {
          debug('Deleted Field: %O', deletedStatus);
          return res.json({
            data: req.body.id
          })
        });
    });

  return router;
}

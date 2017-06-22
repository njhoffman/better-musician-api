const router = require('express').Router();
const Field = require('../../models/Field');

const { debug } = require('debugger-256')('api:fields');

export default function (passport) {
  const updateField = (req, res) => {
    Field.modelById(req.user.id)
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
              });
            });
        }
        debug('Nothing to save to field %O', field);
        return res.json({
          field: field
        });
      });
  };

  const seedField = (req, res, next) => {
    const uid = req.user.id;
    Field.seed(0, { user: uid })
      .then(results => {
        if (results.errors === 0) {
          res.json({ status: 200, results: results });
        } else {
          throw new Error(results.first_error);
        }
      });
  };

  const addField = (req, res, next) => {
    const { user: { id }, body } = req;
    const fieldData = { ...body, ...{ user: id } };
    return Field.save(fieldData)
      .then(results => {
        debug('Added Field: %O', fieldData)
        if (!results.errors) { res.json({ status: 200, data: results }); }
        else { throw new Error(results.first_error); }
      })
  }


  const deleteField = (req, res) => {
    const { user: { id }, body } = req;
    const fieldData = { ...{ id: body.id}, ...{ user: id } };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.json({ status: 400, data: { error: 'No id in request body' } });
    }
    Field.delete(fieldData)
      .then(results => {
        if (!results.errors) { res.json({ status: 200, data: results }); }
        else { throw new Error(results.first_error); }
      })
  };

  router.post('/add',    passport.authenticate('jwt', { session: false }), addField);
  router.post('/update', passport.authenticate('jwt', { session: false }), updateField);
  router.post('/delete', passport.authenticate('jwt', { session: false }), deleteField);
  router.get('/seed',    passport.authenticate('jwt', { session: false }), seedField);

  return router;
}

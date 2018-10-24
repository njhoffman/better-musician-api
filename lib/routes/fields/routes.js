const router = require('express').Router();
const Field = require('../../models/Field');

const { debug } = require('../../utils/logger')('api:routes:fields');

export default function (passport) {
  const updateField = (req, res, next) => {
    const { user: { id }, body } = req;
    const fieldData = { ...body, user: id};
    Field.save(fieldData)
      .then(savedField => {
        return res.json({
          status: 200,
          data: savedField
        });
      }).catch(next);
  }

  const addField = (req, res, next) => {
    const { user: { id }, body } = req;
    const fieldData = { ...body,  user: id };
    Field.save(fieldData)
      .then(results => {
        return res.json({ status: 200, data: results });
      }).catch(next);
  };

  const deleteField = (req, res, next) => {
    const { user: { id }, body } = req;
    const fieldData = { id: body.id,  user: id };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.json({ status: 400, data: { error: 'No id in request body' } });
    }
    Field.delete(fieldData)
      .then(results => {
        return res.json({ status: 200, data: results });
      }).catch(next);
  };

  router.post('/add',    passport.authenticate('jwt', { session: false }), addField);
  router.post('/update', passport.authenticate('jwt', { session: false }), updateField);
  router.post('/delete', passport.authenticate('jwt', { session: false }), deleteField);

  return router;
}

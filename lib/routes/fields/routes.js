const router = require('express').Router();
const Field = require('../../models/Field');

// const { debug } = require('../../utils/logger')('api:routes:fields');

const FieldRoutes = (passport) => {
  const updateField = (req, res, next) => {
    const { user: { id }, body } = req;
    const fieldData = { ...body, user: id };
    Field.save(fieldData)
      .then(savedField => (
        res.status(200).json({ data: savedField })
      ))
      .catch(next);
  };

  const addField = (req, res, next) => {
    const { user: { id }, body } = req;
    const fieldData = { ...body, user: id };
    Field.save(fieldData)
      .then(results => res.status(200).json({ data: results }))
      .catch(next);
  };

  const deleteField = (req, res, next) => {
    const { user: { id }, body } = req;
    const fieldData = { id: body.id, user: id };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.status(400).json({ error: 'No id in request body' });
    }
    return Field.delete(fieldData)
      .then(results => res.status(200).json({ data: results }))
      .catch(next);
  };

  /* eslint-disable no-multi-spaces */
  router.post('/add',    passport.authenticate('jwt', { session: false }), addField);
  router.post('/update', passport.authenticate('jwt', { session: false }), updateField);
  router.post('/delete', passport.authenticate('jwt', { session: false }), deleteField);
  /* eslint-enable no-multi-spaces */

  return router;
};

export default FieldRoutes;

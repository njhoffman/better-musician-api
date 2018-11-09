const router = require('express').Router();
// const Field = require('../../models/Field');

// const { debug } = require('../../utils/logger')('api:routes:fields');

let reqLogger;
let Field;
const FieldRoutes = (passport) => {
  const handleRoute =  (req, res, next) => {
    reqLogger = req.logger.child({ subsystem: 'routes:fields' });
    ({ Field } = req._models_);
    reqLogger.debug('attempting JWT authentication');
    passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
  };

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
  router.post('/add',    handleRoute, addField);
  router.post('/update', handleRoute, updateField);
  router.post('/delete', handleRoute, deleteField);
  /* eslint-enable no-multi-spaces */

  return router;
};

export default FieldRoutes;

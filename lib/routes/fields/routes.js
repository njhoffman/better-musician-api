const router = require('express').Router();
// const Field = require('../../models/Field');

// const { debug } = require('../../utils/logger')('api:routes:fields');

let reqLogger;
const FieldRoutes = (passport, respondSuccess, respondError) => {
  const authRoute =  (req, res, next) => {
    reqLogger = req.logger.child({ subsystem: 'routes:fields' });
    reqLogger.debug('attempting JWT authentication');
    passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
  };

  const updateField = (req, res, next) => {
    const { Field } = req._models_;
    const { user: { id }, body } = req;
    const fieldData = { ...body, user: id };
    return Field.save(fieldData)
      .then(data => respondSuccess('update', data)(req, res))
      .catch(next);
  };

  const addField = (req, res, next) => {
    const { Field } = req._models_;
    const { user: { id }, body } = req;
    const fieldData = { ...body, user: id };
    Field.save(fieldData)
      .then(data => respondSuccess('create', data)(req, res))
      .catch(next);
  };

  const deleteField = (req, res, next) => {
    const { Field } = req._models_;
    const { body } = req;
    const fieldData = { id: body.id };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.status(400).json({ error: 'No id in request body' });
    }
    return Field.delete(fieldData)
      .then(results => {
        respondSuccess('delete', results)(req, res);
      })
      .catch(next);
  };

  /* eslint-disable no-multi-spaces */
  router.post('/add',    authRoute, addField);
  router.post('/update', authRoute, updateField);
  router.post('/delete', authRoute, deleteField);
  /* eslint-enable no-multi-spaces */

  return router;
};

export default FieldRoutes;

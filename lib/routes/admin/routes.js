const router = require('express').Router();
const { isArray } = require('lodash');
const Promise = require('bluebird');
const htmlCss = require('./htmlCss');

const { getTables } = require('../../utils/db');
const {
  seedModel,
  emptyModel,
  resetModel,
  outputCount,
  outputTable,
  outputModel
} = require('./lib');

let reqLogger;
let allModels;
const AdminRoutes = (passport) => {
  const handleRoute =  (req, res, next) => {
    reqLogger = req.logger.child({ subsystem: 'routes:admin' });
    allModels = req._models_;

    if (!__SKIP_AUTH__) {
      reqLogger.info('Attempting authentication with JWT strategy');
      passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
    } else {
      reqLogger.info(`JWT authentication skipped (global __SKIP_AUTH__ set) for admin route ${req.url}`);
    }
    next();
  };

  const outputData = ({ res, output, _ctx }) => {
    let outData = output;
    if (_ctx === 'html') {
      outData = isArray(outData) ? outData.join('<br />') : outData;
      res.status(200).send(htmlCss + outData);
    } else if (_ctx === 'text') {
      outData = isArray(outData) ? outData.join('\n') : outData;
      res.status(200).send(outData);
    } else {
      res.status(200).json({ records: outData });
    }
  };

  const adminListModels = ({ _ctx }, res, next) => (
    // lists all models and record count
    Promise.map(Object.keys(allModels), (modelName) => (
      outputCount(modelName, allModels)
    ))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminListAll = ({ _ctx }, res, next) => (
    // list all models and all records
    Promise.map(Object.keys(allModels), (modelName) => (
      outputModel(modelName, _ctx, allModels)
    ))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminListAllDeep = ({ _ctx }, res, next) => (
    // list all models and all records
    Promise.map(Object.keys(allModels), (modelName) => (
      outputModel(modelName, _ctx, allModels, true)
    ))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminListAllTables = ({ _ctx }, res, next) => (
    // lists all tables (regardless if they have models)
    getTables().then(tableNames => (
      Promise.map(tableNames, (tableName) => (
        outputTable(tableName, _ctx)
      ))
        .then(output => outputData({ res, output, _ctx }))
        .catch(next)
    ))
  );

  const adminListModel =  ({ params: { model }, _ctx }, res, next) => (
    // lists specific model/table
    // TODO: validate table name
    (Object.keys(allModels).indexOf(model) !== -1
      ? outputModel(model, _ctx, allModels)
      : outputTable(model, _ctx))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminListModelDeep =  ({ params: { model }, _ctx }, res, next) => (
    // lists specific model/table with deep relations
    (Object.keys(allModels).indexOf(model) !== -1
      ? outputModel(model, _ctx, allModels, true)
      : outputTable(model, _ctx))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminResetAll = ({ _ctx }, res, next) => (
    Promise.mapSeries(Object.keys(allModels), (modelName) => (
      resetModel(modelName, _ctx, allModels)
    ))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminResetModel = ({ params: { model }, _ctx }, res, next) => (
    resetModel(model, _ctx, allModels)
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminEmptyModel = ({ params: { model }, _ctx }, res, next) => (
    emptyModel(model, _ctx, allModels)
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminSeedModel = ({ params: { model }, _ctx }, res, next) => (
    seedModel(model, _ctx, allModels)
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  /* eslint-disable no-multi-spaces */
  router.get('/list/models',      handleRoute, adminListModels);
  router.get('/list/all',         handleRoute, adminListAll);
  router.get('/list/all/deep',    handleRoute, adminListAllDeep);
  router.get('/list/all/tables',  handleRoute, adminListAllTables);
  router.get('/list/:model',      handleRoute, adminListModel);
  router.get('/list/:model/deep', handleRoute, adminListModelDeep);
  router.get('/reset/all',        handleRoute, adminResetAll);
  router.get('/reset/:model',     handleRoute, adminResetModel);
  router.get('/empty/:model',     handleRoute, adminEmptyModel);
  router.get('/seed/:model',      handleRoute, adminSeedModel);
  /* eslint-enable no-multi-spaces */

  return router;
};

export default AdminRoutes;

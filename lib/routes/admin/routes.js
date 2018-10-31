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


const { debug } = require('../../utils/logger')('api:routes:admin');

const AdminRoutes = (passport, models) => {
  const handleRoute =  (req, res, next) => {
    debug(`matched route: ${req.url}`);
    if (!__SKIP_AUTH__) {
      debug('attempting jwt authentication');
      passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
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
      res.status(200).json({ data: outData });
    }
  };

  const adminListModels = ({ _ctx }, res, next) => (
    // lists all models and record count
    Promise.map(Object.keys(models), (modelName) => (
      outputCount(modelName, models)
    ))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminListAll = ({ _ctx }, res, next) => (
    // list all models and all records
    Promise.map(Object.keys(models), (modelName) => (
      outputModel(modelName, _ctx, models)
    ))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminListAllDeep = ({ _ctx }, res, next) => (
    // list all models and all records
    Promise.map(Object.keys(models), (modelName) => (
      outputModel(modelName, _ctx, models, true)
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
    (Object.keys(models).indexOf(model) !== -1
      ? outputModel(model, _ctx, models)
      : outputTable(model, _ctx))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminListModelDeep =  ({ params: { model }, _ctx }, res, next) => (
    // lists specific model/table with deep relations
    (Object.keys(models).indexOf(model) !== -1
      ? outputModel(model, _ctx, models, true)
      : outputTable(model, _ctx))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminResetAll = ({ _ctx }, res, next) => (
    Promise.map(Object.keys(models), (modelName) => (
      resetModel(modelName, _ctx, models)
    ))
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminResetModel = ({ params: { model }, _ctx }, res, next) => (
    resetModel(model, _ctx, models)
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminEmptyModel = ({ params: { model }, _ctx }, res, next) => (
    emptyModel(model, _ctx, models)
      .then(output => outputData({ res, output, _ctx }))
      .catch(next)
  );

  const adminSeedModel = ({ params: { model }, _ctx }, res, next) => (
    seedModel(model, _ctx, models)
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

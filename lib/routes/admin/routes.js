const router = require('express').Router();
const Promise = require('bluebird');
const { sign:createToken } = require('jsonwebtoken');

const { getTables } = require('../../utils/db');
const {
  emptyModel,
  resetModel,
  outputCount,
  outputTable,
  outputModel
} = require('./lib');


const { info, debug, trace } = require('../../utils/logger')('api:routes:admin');

export default function (passport, models) {

  const handleRoute =  (req, res, next) => {
    debug(`matched route: ${req.url}`);
    if (! __SKIP_AUTH__) {
      debug(`attempting jwt authentication`);
      passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
    }
    next();
  };

  const adminListModels = (req, res, next) => {
    // lists all models and record count
    Promise.map(Object.keys(models), (modelName) => {
      return outputCount(modelName, models);
    }).then(output => {
      res.status(200).send(output.join(''));
    }).catch(next);
  };

  const adminListAll = (req, res, next) => {
    // list all models and all records
    const { _format } = req;
    Promise.map(Object.keys(models), (modelName) => {
      return outputModel(modelName, _format, models);
    }).then(output => {
      res.status(200).send(output.join(''));
    }).catch(next);
  };

  const adminListAllDeep = (req, res, next) => {
    // list all models and all records
    const { _format } = req;
    Promise.map(Object.keys(models), (modelName) => {
      return outputModel(modelName, _format, models, true);
    }).then(output => {
      // trace('all deep', output);
      res.status(200).send(output.join(''));
    }).catch(next);
  };

  const adminListAllTables = (req, res, next) => {
    // lists all tables (regardless if they have models)
    let out = '';
    const { _format } = req;
    getTables().then(tableNames => {
      Promise.map(tableNames, (tableName) => {
        return outputTable(tableName, _format);
      }).then(output => {
        res.status(200).send(output.join(''));
      })
    }).catch(next);
  };

  const adminListModel =  (req, res, next) => {
    // lists specific model/table
    // TODO: validate table name
    const { params: { model }, _format } = req;
    return ((Object.keys(models).indexOf(model) !== -1)
      ? outputModel(model, _format, models)
      : outputTable(model, _format))
      .then(output => {
        res.status(200).send(output);
      }).catch(next);
  };

  const adminListModelDeep =  (req, res, next) => {
    // lists specific model/table with deep relations
    // TODO: validate table name
    const { params: { model }, _format } = req;
    return ((Object.keys(models).indexOf(model) !== -1)
      ? outputModel(model, _format, models, true)
      : outputTable(model, _format))
      .then(output => {
        res.status(200).send(output);
      }).catch(next);
  };

  const adminResetAll = (req, res, next) => {
    const { _format } = req;
    return Promise.map(Object.keys(models), (modelName) => {
      return resetModel(modelName, _format, models);
    }).then(output => {
      res.status(200).send(output.join(''));
    }).catch(next);
  };

  const adminResetModel = (req, res, next) => {
    const { params: { model }, _format } = req;
    return resetModel(model, _format, models).then(output => {
      res.status(200).send(output);
    }).catch(next);
  };

  const adminEmptyModel = (req, res, next) => {
    const { params: { model }, _format } = req;
    return emptyModel(model, _format, models).then(output => {
      res.status(200).send(output);
    }).catch(next);
  };

  router.get('/list/models',     handleRoute, adminListModels);
  router.get('/list/all',        handleRoute, adminListAll);
  router.get('/list/all/deep',   handleRoute, adminListAllDeep);
  router.get('/list/all/tables', handleRoute, adminListAllTables);
  router.get('/list/:model',     handleRoute, adminListModel);
  router.get('/list/:model/deep',handleRoute, adminListModelDeep);
  router.get('/reset/all',       handleRoute, adminResetAll);
  router.get('/reset/:model',    handleRoute, adminResetModel);
  router.get('/empty/:model',    handleRoute, adminEmptyModel);

  return router;
}

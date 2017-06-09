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


const { debug } = require('debugger-256')('api:routes:admin');

export default function (passport, models) {
  const authFlag = false;

  const handleRoute =  (req, res, next) => {
    debug(`matched route: ${req.url}`);
    if (authFlag) {
      debug(`attempting jwt authentication`);
      passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
    }
    next();
  };

  const adminListModels = (req, res) => {
    // lists all models and record count
    const isCurl = req._isCurl;
    Promise.map(Object.keys(models), (modelName) => {
      return outputCount(modelName);
    }).then(output => {
      res.status(200).send(output.join(''));
    });
  };

  const adminListAll = (req, res) => {
    // list all models and all records
    const isCurl = req._isCurl;
    Promise.map(Object.keys(models), (modelName) => {
      return outputModel(modelName, isCurl);
    }).then(output => {
      res.status(200).send(output.join(''));
    });
  };

  const adminListAllTables = (req, res) => {
    // lists all tables (regardless if they have models)
    let out = '';
    const isCurl = req._isCurl;
    getTables().then(tableNames => {
      Promise.map(tableNames, (tableName) => {
        return outputTable(tableName, isCurl);
      }).then(output => {
        res.status(200).send(output.join(''));
      });
    });
  };

  const adminListModel =  (req, res) => {
    // lists specific model/table
    const name = req.params.model;
    const isCurl = req._isCurl;
    return ((Object.keys(models).indexOf(name) !== -1)
      ? outputModel(name, isCurl)
      : outputTable(name, isCurl))
      .then(output => {
        res.status(200).send(output);
      });
  };

  const adminResetAll = (req, res) => {
    return Promise.map(Object.keys(models), (modelName) => {
      const isCurl = req._isCurl;
      return resetModel(modelName, isCurl);
    }).then(output => {
      res.status(200).send(output.join(''));
    });
  };

  const adminResetModel = (req, res) => {
    const name = req.params.model;
    const isCurl = req._isCurl;
    return resetModel(name, isCurl).then(output => {
      res.status(200).send(output);
    });
  };

  const adminEmptyModel = (req, res) => {
    const model = req.params.model;
    const isCurl = req._isCurl;
    return emptyModel(model, isCurl).then(output => {
      res.status(200).send(output);
    });
  };

  router.get('/list/models',     handleRoute, adminListModels);
  router.get('/list/all',        handleRoute, adminListAll);
  router.get('/list/all/tables', handleRoute, adminListAllTables);
  router.get('/list/:model',     handleRoute, adminListModel);
  router.get('/reset/all',       handleRoute, adminResetAll);
  router.get('/reset/:model',    handleRoute, adminResetModel);
  router.get('/empty/:model',    handleRoute, adminEmptyModel);

  return router;
}

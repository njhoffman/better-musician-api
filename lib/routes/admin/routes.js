const router = require('express').Router();
const { isArray } = require('lodash');
const Promise = require('bluebird');
const { sign:createToken } = require('jsonwebtoken');
const htmlCss = require('./htmlCss');

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

  const outputData = ({ res, output, _ctx }) => {
    let outData = output;
    if (_ctx === 'html') {
      outData = isArray(outData) ? outData.join('<br />') : outData;
      return res.status(200).send(htmlCss + outData);
    } else if (_ctx === 'text') {
      outData = isArray(outData) ? outData.join('\n') : outData;
      return res.status(200).send(outData);
    }
    return res.status(200).json(outData);
  };

  const adminListModels = ({ _ctx }, res, next) => {
    // lists all models and record count
    Promise.map(Object.keys(models), (modelName) => {
      return outputCount(modelName, models);
    }).then(output => {
      return outputData({ res, output, _ctx });
    }).catch(next);
  };

  const adminListAll = ({ _ctx }, res, next) => {
    // list all models and all records
    Promise.map(Object.keys(models), (modelName) => {
      return outputModel(modelName, _ctx, models);
    }).then(output => {
      return outputData({ res, output, _ctx });
    }).catch(next);
  };

  const adminListAllDeep = ({ _ctx }, res, next) => {
    // list all models and all records
    Promise.map(Object.keys(models), (modelName) => {
      return outputModel(modelName, _ctx, models, true);
    }).then(output => {
      // trace('all deep', output);
      return outputData({ res, output, _ctx });
    }).catch(next);
  };

  const adminListAllTables = ({ _ctx }, res, next) => {
    // lists all tables (regardless if they have models)
    let out = '';
    getTables().then(tableNames => {
      Promise.map(tableNames, (tableName) => {
        return outputTable(tableName, _ctx);
      }).then(output => {
        return outputData({ res, output, _ctx });
      }).catch(next);
    });
  }

  const adminListModel =  (req, res, next) => {
    // lists specific model/table
    // TODO: validate table name
    const { params: { model }, _ctx } = req;
    return ((Object.keys(models).indexOf(model) !== -1)
      ? outputModel(model, _ctx, models)
      : outputTable(model, _ctx))
      .then(output => {
        return outputData({ res, output, _ctx });
      }).catch(next);
  };

  const adminListModelDeep =  (req, res, next) => {
    // lists specific model/table with deep relations
    // TODO: validate table name
    const { params: { model }, _ctx } = req;
    return ((Object.keys(models).indexOf(model) !== -1)
      ? outputModel(model, _ctx, models, true)
      : outputTable(model, _ctx))
      .then(output => {
        return outputData({ res, output, _ctx });
      }).catch(next);
  };

  const adminResetAll = ({ _ctx }, res, next) => {
    return Promise.map(Object.keys(models), (modelName) => {
      return resetModel(modelName, _ctx, models);
    }).then(output => {
      return outputData({ res, output, _ctx });
    }).catch(next);
  };

  const adminResetModel = (req, res, next) => {
    const { params: { model }, _ctx } = req;
    return resetModel(model, _ctx, models).then(output => {
      return outputData({ res, output, _ctx });
    }).catch(next);
  };

  const adminEmptyModel = (req, res, next) => {
    const { params: { model }, _ctx } = req;
    return emptyModel(model, _ctx, models).then(output => {
      return outputData({ res, output, _ctx });
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

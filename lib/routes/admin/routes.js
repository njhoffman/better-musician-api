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

  const htmlSnippet = [
    '<style type="text/css">',
    'body {',
    '  font-family: "Consolas", monospace;',
    '  font-weight: normal;',
    '  font-size: 12px;',
    '  line-height: 16px;',
    '  letter-spacing: 0;',
    '  background-color: #080808;',
    '  color: #d4d4d4;',
    '  text-align: left;',
    '  border-top: 1px solid #121516;',
    '  padding: 10px;',
    '  margin: 0;',
    '  display: flex;',
    '  justify-content: space-around;',
    '}',
    '::-webkit-scrollbar { width: 10px; }',
    '::-webkit-scrollbar-thumb { background: #666; border-radius: 10px; }',
    '::-webkit-scrollbar-track {  background: #222; border-radius: 10px; }',
    '::-webkit-scrollbar-button { background: #666; height: 15px; border-radius: 50%; }',
    '.col { }',
    '.json-pretty { padding: 30px; max-height: 100vh; overflow-y: auto; }',
    '.json-selected { background-color: rgba(139, 191, 228, 0.19999999999999996) }',
    '.json-string { color: #00ccaa; }',
    '.json-key { color: #8caedd; }',
    '.json-boolean { color: #cc9994; }',
    '.json-number { color: #cc9994; }',
    '</style>'
  ];

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
      res.status(200).send(htmlSnippet.join('\n') + output.join('\n'));
    }).catch(next);
  };

  const adminListAll = (req, res, next) => {
    // list all models and all records
    const { _format } = req;
    Promise.map(Object.keys(models), (modelName) => {
      return outputModel(modelName, _format, models);
    }).then(output => {
      res.status(200).send(htmlSnippet.join('\n') + output.join('\n'));
      // res.status(200).send(htmlSnippet.join('\n') + output.join('\n'));
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
        res.status(200).send(htmlSnippet.join('\n') + output);
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
        res.status(200).send(htmlSnippet.join('\n') + output.join('\n'));
      }).catch(next);
  };

  const adminResetAll = (req, res, next) => {
    const { _format } = req;
    return Promise.map(Object.keys(models), (modelName) => {
      return resetModel(modelName, _format, models);
    }).then(output => {
        res.status(200).send(htmlSnippet.join('\n') + output.join('\n'));
    }).catch(next);
  };

  const adminResetModel = (req, res, next) => {
    const { params: { model }, _format } = req;
    return resetModel(model, _format, models).then(output => {
      res.status(200).send(htmlSnippet.join('\n') + output);
    }).catch(next);
  };

  const adminEmptyModel = (req, res, next) => {
    const { params: { model }, _format } = req;
    return emptyModel(model, _format, models).then(output => {
      res.status(200).send(htmlSnippet.join('\n') + output);
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

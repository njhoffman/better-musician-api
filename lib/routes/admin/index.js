import Promise from 'bluebird';
import { sign as createToken } from 'jsonwebtoken';
import { dumpTable, resetTable, getTables } from '../../utils/db';
import Models from '../../models';

const { debug } = require('debugger-256')('api:routes:admin');
const router = require('express').Router();

const outputTableText = (name, records) => {
  let output = `\n${name}`;
  records.forEach((record) => {
    output += `\n   ${record.id}`;
    Object.keys(record).forEach((field) => {
      if (field !== 'id') {
        output += `\n      ${field} => ${record[field]}`;
      }
    });
  });
  return output;
};

const outputTableHtml = (name, records) => {
  let output = `<br /><h3>${name}</h3>`;
  records.forEach(function (record) {
    output += `<pre>${JSON.stringify(record)}</pre>`;
  });
  return output;
};

const outputTable = (name, isCurl) => {
  return dumpTable(name)
    .then(records => {
      if (isCurl) {
        return outputTableText(name, records);
      } else {
        return outputTableHtml(name, records);
      }
    });
};

const outputModel = (name, isCurl) => {
  return Models[name].all
    .then(records => {
      if (isCurl) {
        return outputTableText(name, records);
      } else {
        return outputTableHtml(name, records);
      }
    });
};

const outputCount = (name) => {
  return Models[name].getCount()
    .then(count => {
      return `\n${name}\t${count}`;
    });
};

const resetModel = (name, isCurl) => {
  return Models[name].reset()
    .then((results) => {
      if (results.errors === 0) {
        return `\nReset model ${name} with ${results.inserted} records`;
      } else {
        throw Error(`Error resetting model ${name}`);
      }
    });
};

const emptyModel = (name, isCurl) => {
  // TODO: setup custom error handling
  if (!Models[name]) {
    return Promise.resolve(`\nModel ${name} does not exist`);
  }
  return Models[name].empty()
    .then((results) => {
      if (results.errors === 0) {
        return `\nEmptied model ${name}`;
      } else {
        throw Error(`Error emptying model ${name}`);
      }
    });
};

export default function (passport) {

  const authFlag = true;

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
    Promise.map(Object.keys(Models), (modelName) => {
      return outputCount(modelName);
    }).then(output => {
      res.status(200).send(output.join(''));
    })
  };

  const adminListAll = (req, res) => {
    // list all models and all records
    const isCurl = req._isCurl;
    Promise.map(Object.keys(Models), (modelName) => {
      return outputModel(modelName, isCurl);
    }).then(output => {
      res.status(200).send(output.join(''));
    }).catch(promiseError.bind(undefined, res));
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
      }).catch(promiseError.bind(undefined, res));
    });
  };

  const adminListModel =  (req, res) => {
    // lists specific model/table
    const name = req.params.model;
    const isCurl = req._isCurl;
    return ((Object.keys(Models).indexOf(name) !== -1)
      ? outputModel(name, isCurl)
      : outputTable(name, isCurl))
      .then(output => {
        res.status(200).send(output);
      });
  };

  const adminResetAll = (req, res) => {
    return Promise.map(Object.keys(Models), (modelName) => {
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

  router.get('/list/models', handleRoute, adminListModels);
  router.get('/list/all', handleRoute, adminListAll);
  router.get('/list/all/tables', handleRoute, adminListAllTables);
  router.get('/list/:model',  handleRoute, adminListModel);
  router.get('/reset/all',    handleRoute, adminResetAll);
  router.get('/reset/:model', handleRoute, adminResetModel);
  router.get('/empty/:model', handleRoute, adminEmptyModel);

  return router;
}

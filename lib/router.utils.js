const assert = require('assert');
const _ = require('lodash');

// all responses from server should be json { status: 200, records: [], ?changed: []};
//   query { records: [] }
//   update  { changed: { new, old, delta }, records: {}};
//   add { records: {} };
//   delete [ids]

const __TEST__ = process.env.NODE_ENV === 'test';

const respondSuccess = (operation, { records, changed }) => (req, res) => {
  assert(_.isObject(req));
  assert(_.isObject(res));

  if (!__TEST__) {
    switch (operation) {
      case 'delete':
        assert(_.isArray(records));
        assert(records.length > 0);
        records.forEach(rd => assert(typeof rd === 'string'));
        break;
      case 'update':
        assert(_.isObject(records));
        assert(_.keys(records).length > 0);
        assert(_.isObject(changed));
        assert(changed.delta.length > 0);
        break;
      case 'create':
        assert(_.isObject(records));
        assert(_.keys(records).length > 0);
        break;
      case 'query':
        assert(_.isArray(records));
        break;
      default:
        throw new Error(`Unknown responseSuccess operation: ${operation}`, records);
    }
  }

  const returnData = {
    status: 200,
    success: true,
    records: [].concat(records),
    changed
  };

  return res
    .status(returnData.status)
    .json(returnData);
};

const respondError = (CustomError) => (req, res) => {
  if (!__TEST__) {
    assert(_.has(CustomError, 'message'));
    assert(_.has(CustomError, 'status'));
    assert(_.has(CustomError, 'title'));
    if (_.isFunction(CustomError, 'assertions')) {
      CustomError.assertions(CustomError.meta);
    }
  }

  const { message, status, title, meta } = CustomError;
  const returnData = { status, message, title, records: meta, success: false };
  res.status(status).json(returnData);
};

module.exports = {
  respondSuccess,
  respondError
};

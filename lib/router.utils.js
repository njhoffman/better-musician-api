const assert = require('assert');
const _ = require('lodash');

// all responses from server should be json { status: 200, records: [], ?changed: []};
// data from routes to here should be:
//   opResult => { inserted, replaced, deleted, skipped, unchanged }
//   query { ...opResult, records: [] }
//   update  { ...opResult, changed: { new, old, delta }, records: {}};
//   add { ...opResult, records: {} };
//   delete [ids]

const __TEST__ = process.env.NODE_ENV === 'test';

const respondSuccess = (operation, data) => (req, res) => {
  const { records, changed } = data;
  assert(_.isObject(req));
  assert(_.isObject(res));

  if (!__TEST__) {
    switch (operation) {
      case 'delete':
        assert(_.has(data, 'deleted'));
        if (data.deleted > 0) {
          assert(_.isArray(changed));
          assert(_.isArray(changed[0].delta));
          assert(_.isObject(changed[0].old));
        }
        break;
      case 'update':
        assert(_.has(data, 'replaced'));
        if (data.replaced > 0) {
          assert(_.isArray(changed));
          assert(_.isArray(changed[0].delta));
          assert(_.isObject(changed[0].new));
        }
        assert(_.isObject(records));
        assert(_.keys(records).length > 0);
        break;
      case 'create':
        assert(_.has(data, 'inserted'));
        if (data.inserted > 0) {
          assert(_.isArray(changed));
          assert(_.isArray(changed[0].delta));
          assert(_.isObject(changed[0].new));
        }
        assert(_.isArray(records) || _.isObject(records));
        break;
      case 'query':
        assert(_.isArray(records) || _.isObject(records));
        break;
      default:
        throw new Error(`Unknown responseSuccess operation: ${operation}`, data);
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

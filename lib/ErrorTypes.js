const _ = require('lodash');
const assert = require('assert');

// error: [ title, message, status, requestObject, meta?, assertions? ]
// 403 forbidden, 405 method not allowed, 408 request timeout,
// 500 internal error, 501 not implemented, 502 bad gateway, 503 service unavailable, 504 gateway timeout

const ErrorDefinitions = {
  InvalidRequestParams: {
    title: 'Invalid Request Parameters',
    status: 400,
    assertions: (meta) => {
      assert(_.has(meta, 'params'));
      assert(_.isObject(meta.params));
      assert(_.isArray(_.keys(meta.params)));
      assert(_.keys(meta.params).length > 0);
      _.keys(meta.params).forEach(key => {
        assert(_.isString(meta.params[key]));
      });
    },
  },
  UnAuthorizedRequest: {
    title: 'Unauthorized Request',
    status: 400
  },
  LoginFailedAuth: {
    title: 'Login Error',
    status: 401,
    assertions: (meta) => {
      assert(_.has(meta, 'fields'));
      assert(_.isObject(meta.fields));
      assert(_.isArray(_.keys(meta.fields)));
      assert(_.keys(meta.fields).length > 0);
    },
  },
  TokenValidationNoUser: {
    title: 'Token Validation Error',
    status: 401
  },
  RegisterError: { },
  AccountExists: {
    title: 'Account Exists',
    status: 401
  },
  FieldValidationError: { }
};

const ErrorTypes = _.mapValues(ErrorDefinitions, (Ed, name) => (
  (message, meta) => ({ ...Ed, message, meta, name })
));

module.exports = ErrorTypes;

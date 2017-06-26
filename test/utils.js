const { pick } = require('lodash');
const initServer = require('../lib/server');
const getModels = require('../lib/models/');

const { _dbg } = require('debugger-256')('api:test');

const login = (app) =>
  new Promise((resolve, reject) => {
    return request(app)
      .post('/users/login')
      .send({
        'email-sign-in-email': 'testuser@example.com',
        'email-sign-in-password': 'dummypassword'
      }).end((err, res) => {
        if (err) { reject(err); }
        const headers = pick(res.headers, [
          'access-token',
          'token-type'
        ]);
        headers.authorization = `Bearer ${res.headers['access-token']}`;
        resolve(headers);
      })
  });

const logout = (app, headers) =>
  new Promise((resolve, reject) => {
    return request(app)
      .delete('/users/logout')
      .end((err, res) => {
        if (err) { reject(err); }
        resolve();
      })
  });

const setupServer = () =>
  new Promise((resolve, reject) => {
    return initServer().then(app => {
      return request(app)
        .get('/admin/reset/all')
        .then(res => {
          resolve(app);
        }).catch(err => reject(err));
    });
  });

const outModelByField = (modelName, field) =>
  new Promise((resolve, reject) => {
    const Model = getModels()[modelName];
    return Model.findByField(field)
      .then(res => {
        // _dbg(`${modelName} by field ${field}`, res);
        resolve(res);
      });
  });

const outModelAll = (modelName) =>
  new Promise((resolve, reject) => {
    const Model = getModels()[modelName];
    return Model.all
      .then(res => {
        // _dbg(`${modelName} (all)`, res);
        resolve(res);
      });
  });

module.exports = { login, logout, setupServer, outModelByField, outModelAll };

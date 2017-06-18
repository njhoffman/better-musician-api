const { pick } = require('lodash');
const initServer = require('../../lib/server');

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

module.exports = { login, logout, setupServer };

const { pick } = require('lodash');

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

const setupServer = () => {
  const initServer = require('../../lib/server');
  return initServer();
};

module.exports = { login, setupServer };

const _ = require('lodash');
const cookie = require('cookie');

module.exports = {
  serializers : {
    _request: (_req) => {
      const parsedCookie = _req.headers && _req.headers.cookie ? cookie.parse(_req.headers.cookie) : {};
      _.each(_.keys(parsedCookie), key => {
        try {
          parsedCookie[key] = JSON.parse(parsedCookie[key]);
        } catch (e) {
          /* eslint-disable no-console */
          console.error(e);
          /* eslint-enable no-console */
        }
      });
      return {
        req: _.merge(_req, { headers: { cookie: parsedCookie } })
      };
    },
    _response: (_res) => ({
      _res
    })
  }
};

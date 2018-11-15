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
          return false;
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

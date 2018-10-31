const loginRoute = require('./users/login');
const logoutRoute = require('./users/logout');
const meRoute = require('./users/me');
const registerRoute = require('./users/register');
const updateRoute = require('./users/update');
const validateTokenRoute = require('./users/validate_token');

module.exports = function(routes) {
  describe('User Routes', () => {
    loginRoute(routes);
    logoutRoute(routes);
    meRoute(routes);
    registerRoute(routes);
    updateRoute(routes);
    validateTokenRoute(routes);
  });
};

const loginRoute = require('./users/login');
const logoutRoute = require('./users/logout');
const meRoute = require('./users/me');
const registerRoute = require('./users/register');
const updateRoute = require('./users/update');
const validateTokenRoute = require('./users/validate_token');

  describe('User Routes', () => {
    loginRoute();
    logoutRoute();
    meRoute();
    registerRoute();
    updateRoute();
    validateTokenRoute();
  });

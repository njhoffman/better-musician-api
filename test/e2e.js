const apiRoutes = require('./e2e/api');
const userRoutes = require('./e2e/users');
const fieldRoutes = require('./e2e/fields');
const songRoutes = require('./e2e/songs');

describe('e2e Route Tests', () => {
  const routes = [];

  after(function() {
    console.log(`Successfully tested: ${routes.length} routes...`);
    console.log('Starting unit tests');
  });
  apiRoutes(routes);
  userRoutes(routes);
  fieldRoutes(routes);
  songRoutes(routes);
});

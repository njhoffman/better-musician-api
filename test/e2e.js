const { info } = _initLogger_('e2e');

const apiRoutes = require('./e2e/api');
const userRoutes = require('./e2e/users');
const fieldRoutes = require('./e2e/fields');
const songRoutes = require('./e2e/songs');

// TODO; find a way to report routing errors not expected during tests

describe('e2e Route Tests', () => {
  const routes = [];


  after(function() {
    info(`Finished testing ${routes.length} routes...`);
    info('Starting unit tests');
  });

  apiRoutes(routes);
  userRoutes(routes);
  fieldRoutes(routes);
  songRoutes(routes);
});

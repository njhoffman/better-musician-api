const apiRoutes = require('./e2e/api');
const userRoutes = require('./e2e/users');
const fieldRoutes = require('./e2e/fields');
const songRoutes = require('./e2e/songs');

describe('e2e Route Tests', () => {
  apiRoutes();
  userRoutes();
  fieldRoutes();
  songRoutes();
});

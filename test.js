// TODO: replace db route queries with direct db model calls

const apiRoutes = require('./e2e/api');
const fieldRoutes = require('./e2e/fields');
const userRoutes = require('./e2e/users');
const songRoutes = require('./e2e/songs');


describe('e2e Tests', () => {
  apiRoutes();
  fieldRoutes();
  userRoutes();
  songRoutes();

});

describe('Model Tests', () => { });

const addRoute = require('./fields/add');
const deleteRoute = require('./fields/delete');
const updateRoute = require('./fields/update');

module.exports = function(routes) {
  describe('Field Routes', () => {
    addRoute(routes);
    deleteRoute(routes);
    updateRoute(routes);
  });
};

const addRoute = require('./fields/add');
const deleteRoute = require('./fields/delete');
const updateRoute = require('./fields/update');

module.exports = function() {
  describe('Field Routes', () => {
    addRoute();
    deleteRoute();
    updateRoute();
  });
}

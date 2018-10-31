const addRoute = require('./songs/add');
const deleteRoute = require('./songs/delete');
const emptyRoute = require('./songs/empty');
const indexRoute = require('./songs/index');

module.exports = function(routes) {
  describe('Song Routes', () => {
    addRoute(routes);
    deleteRoute(routes);
    emptyRoute(routes);
    indexRoute(routes);
  });
};

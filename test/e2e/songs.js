const addRoute = require('./songs/add');
const deleteRoute = require('./songs/delete');
const emptyRoute = require('./songs/empty');
const indexRoute = require('./songs/index');

module.exports = function() {
  describe('Song Routes', () => {
    addRoute();
    deleteRoute();
    emptyRoute();
    indexRoute();
  });
}

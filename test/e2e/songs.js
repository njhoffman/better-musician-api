const addRoute = require('./songs/add');
const deleteRoute = require('./songs/delete');
const emptyRoute = require('./songs/empty');
const indexRoute = require('./songs/index');

  describe('Song Routes', () => {
    addRoute();
    deleteRoute();
    emptyRoute();
    indexRoute();
  });

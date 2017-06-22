const addRoute = require('./fields/add');
const deleteRoute = require('./fields/delete');
const updateRoute = require('./fields/update');
const seedRoute = require('./fields/seed');

  describe('Field Routes', () => {
    addRoute();
    deleteRoute();
    updateRoute();
    seedRoute();
  });

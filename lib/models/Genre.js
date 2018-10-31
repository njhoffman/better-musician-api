const BaseModel = require('./_BaseModel');
// const { debug } = require('../utils/logger')('api:model:genre');

class Genre extends BaseModel {
  static get tableName() { return 'genres'; }

  static get modelName() { return 'Genre'; }

  static get tableKeys() {
    return {
      id: {},
      name: { required: true, unique: true },
      approved: { default: false },
      updatedAt: {}
    };
  }

  static get modelData() {
    const { tableName, modelName, tableKeys } = Genre;
    return { tableName, modelName, tableKeys };
  }

  constructor(genreData) {
    super(Genre.modelData, genreData);
  }
}

module.exports = Genre;

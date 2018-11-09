const BaseModel = require('./_BaseModel');
const User = require('./User');
// const { debug } = require('../utils/logger')('api:model:genre');

class Genre extends BaseModel {
  static get tableName() { return 'genres'; }

  static get modelName() { return 'Genre'; }

  static get tableKeys() {
    return {
      id          : {},
      user        : { required: true, relation: { Model: User, allowId: true } },
      name        : { required: true, unique: true },
      status      : { default: 'private' },
      images      : [],
      displayName : {},
      updatedAt   : []
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

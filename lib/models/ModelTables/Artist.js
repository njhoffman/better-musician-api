const ModelBase = require('../ModelBase');
const User = require('./User');
// const { debug } = require('../utils/logger')('api:model:artist');

class Artist extends ModelBase {
  static get tableName() { return 'artists'; }

  static get modelName() { return 'Artist'; }

  static get modelData() {
    const { tableName, modelName, tableKeys } = Artist;
    return { tableName, modelName, tableKeys };
  }

  static get tableKeys() {
    return {
      id        : {},
      user      : { required: true, relation: { Model: User }, default: this.userId },
      firstName : { unique: true },
      lastName  : { required: true, unique: true },
      status    : { default: 'private' },
      images    : [],
      updatedAt : []
    };
  }

  constructor(artistData, parent) {
    super(Artist.modelData, artistData, parent);
  }
}

module.exports = Artist;

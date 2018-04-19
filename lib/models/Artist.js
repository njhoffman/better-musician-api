const BaseModel = require('./_BaseModel');
const { debug } = require('../utils/logger')('api:model:artist');

class Artist extends BaseModel {
  static get tableName () { return 'artists'; }
  static get modelName () { return 'Artist'; }

  static get modelData () {
    const { tableName, modelName, tableKeys } = Artist;
    return { tableName, modelName, tableKeys };
  }

  static get tableKeys () {
    return {
      id: {},
      firstName: { unique: true },
      lastName: { required: true, unique: true },
      approved: { default: false },
      pictures: {}
    }
  }

  constructor (artistData) {
    super(Artist.modelData, artistData);
  }

};
module.exports = exports = Artist;

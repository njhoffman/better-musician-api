const BaseModel = require('./_BaseModel');
const initialArtists = require('./initialData/artists');
const { debug } = require('debugger-256')('api:model:artist');

class Artist extends BaseModel {
  static get tableName () { return 'artists'; }
  static get modelName () { return 'Artist'; }
  static get tableKeys () { return ['email', 'uid', 'id']; }
  static get initialData() { return initialArtists; }

  constructor (artist) {
    super();
  }

};
module.exports = exports = Artist;

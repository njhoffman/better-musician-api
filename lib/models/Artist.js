const BaseModel = require('./_BaseModel');
const { debug } = require('debugger-256')('api:model:artist');

class Artist extends BaseModel {
  static get tableName () { return 'artists'; }
  static get modelName () { return 'Artist'; }
  static get tableKeys () { return ['email', 'uid', 'id']; }

  constructor (artist) {
    super();
  }

};
module.exports = exports = Artist;

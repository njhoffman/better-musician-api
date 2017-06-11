const BaseModel = require('./_BaseModel');
const { debug } = require('debugger-256')('api:model:genre');

class Genre extends BaseModel {
  static get tableName () { return 'genres'; }
  static get modelName () { return 'Genre'; }

  static get tableKeys () {
    return ['email', 'uid', 'id'];
  }

  constructor (genre) {
    super();
  }
};
module.exports = exports = Genre;

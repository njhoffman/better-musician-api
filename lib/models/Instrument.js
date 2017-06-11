const BaseModel = require('./_BaseModel');

const { debug } = require('debugger-256')('api:model:instrument');

class Instrument extends BaseModel {
  static get tableName () { return 'instruments'; }
  static get modelName () { return 'Instrument'; }

  static get tableKeys () {
    return ['email', 'uid', 'id'];
  }


  constructor (instrument) {
    super();
  }
};
module.exports = exports = Instrument;

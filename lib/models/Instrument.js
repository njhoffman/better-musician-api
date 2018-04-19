const BaseModel = require('./_BaseModel');

const { debug } = require('../utils/logger')('api:model:instrument');

class Instrument extends BaseModel {
  static get tableName () { return 'instruments'; }
  static get modelName () { return 'Instrument'; }

  static get tableKeys () {
    return {
      id: {},
      name: { required: true, unique: true },
      approved: { default: false },
      updatedAt: {}
    }
  }

  static get modelData () {
    const { tableName, modelName, tableKeys } = Instrument;
    return { tableName, modelName, tableKeys };
  }


  constructor (instrumentData) {
    super(Instrument.modelData, instrumentData);
  }
};
module.exports = exports = Instrument;

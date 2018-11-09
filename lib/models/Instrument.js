const BaseModel = require('./_BaseModel');
const User = require('./User');

// const { debug } = require('../utils/logger')('api:model:instrument');

class Instrument extends BaseModel {
  static get tableName() { return 'instruments'; }

  static get modelName() { return 'Instrument'; }

  static get tableKeys() {
    return {
      id          : {},
      user        : { required: true, relation: { Model: User, allowId: true } },
      name        : { required: true, unique: true },
      status      : { default: 'private' },
      displayName : {},
      images      : [],
      updatedAt   : []
    };
  }

  static get modelData() {
    const { tableName, modelName, tableKeys } = Instrument;
    return { tableName, modelName, tableKeys };
  }


  constructor(instrumentData) {
    super(Instrument.modelData, instrumentData);
  }
}
module.exports = Instrument;

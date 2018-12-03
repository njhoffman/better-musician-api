const BaseModel = require('lib/models/_BaseModel');
const User = require('lib/models/User');

// const { debug } = require('../utils/logger')('api:model:instrument');

class Instrument extends BaseModel {
  static get tableName() { return 'instruments'; }

  static get modelName() { return 'Instrument'; }

  static get tableKeys() {
    return {
      id          : {},
      user        : { required: true, relation: { Model: User }, default: this.userId },
      name        : { required: true, unique: true },
      status      : { default: 'private' },
      images      : [],
      updatedAt   : []
    };
  }

  static get modelData() {
    const { tableName, modelName, tableKeys } = Instrument;
    return { tableName, modelName, tableKeys };
  }

  constructor(instrumentData, existing) {
    super(Instrument.modelData, instrumentData, existing);
  }
}
module.exports = Instrument;

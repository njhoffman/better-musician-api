const ModelBase = require('../ModelBase');
const User = require('./User');

// const { debug } = require('../utils/logger')('api:model:instrument');

class Instrument extends ModelBase {
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

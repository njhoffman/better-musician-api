const BaseModel = require('./_BaseModel');
const User = require('./User');
// const { debug } = require('../utils/logger')('api:model:field');

class Field extends BaseModel {
  static get tableName() { return 'fields'; }

  static get modelName() { return 'Field'; }

  static get modelData() {
    const { tableName, modelName, tableKeys } = Field;
    return { tableName, modelName, tableKeys };
  }

  /* eslint-disable indent, object-property-newline */
  static get tableKeys() {
    return {
      id:           {},
      user:         { required: true,
                      relation: { Model: User, allowId: true },
                      default: this.userId, authLock: ['admin'] },
      type:         { required: true },
      label:        { required: true },
      tabName:      { required: true },
      options:      { required: false },
      updatedAt:    []
    };
  }
  /* eslint-enable indent, object-property-newline */

  constructor(fieldData, parent) {
    super(Field.modelData, fieldData, parent);
  }
}

module.exports = Field;

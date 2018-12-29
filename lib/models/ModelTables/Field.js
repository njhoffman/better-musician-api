const ModelBase = require('../ModelBase');
const User = require('./User');
// const { debug } = require('../utils/logger')('api:model:field');

class Field extends ModelBase {
  static get tableName() { return 'fields'; }

  static get modelName() { return 'Field'; }

  static get modelData() {
    const { tableName, modelName, tableKeys } = Field;
    return { tableName, modelName, tableKeys };
  }

  /* eslint-disable indent, object-property-newline */
  static get tableKeys() {
    return {
      id: {},
      user: {
        required: true,
        relation: { Model: User },
        default: this.userId,
        authLock: ['admin']
      },
      // TODO: implemeent required validation check for type || typeId (custom function)
      typeId: { required: true },
      label: { required: true },
      options: { required: false },
      updatedAt: []
    };
  }
  /* eslint-enable indent, object-property-newline */

  constructor(fieldData, parent) {
    super(Field.modelData, fieldData, parent);
  }
}

module.exports = Field;

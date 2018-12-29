const ModelBase = require('../ModelBase');
const User = require('./User');
const Field = require('./Field');
// const { debug } = require('../utils/logger')('api:model:field');

class FieldTab extends ModelBase {
  static get tableName() { return 'fieldTabs'; }

  static get modelName() { return 'FieldTab'; }

  static get modelData() {
    const { tableName, modelName, tableKeys } = FieldTab;
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
      fields: {
        required: true,
        relation: { Model: Field },
      },
      name: { required: true },
      updatedAt: []
    };
  }
  /* eslint-enable indent, object-property-newline */

  constructor(fieldTabData, parent) {
    super(FieldTab.modelData, fieldTabData, parent);
  }
}

module.exports = FieldTab;

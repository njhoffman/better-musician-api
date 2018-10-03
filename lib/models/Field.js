const BaseModel = require('./_BaseModel');
const User = require('./User');
const { isUndefined } = require('lodash');
const { debug } = require('../utils/logger')('api:model:field');

class Field extends BaseModel {
  static get tableName () { return 'fields'; }
  static get modelName () { return 'Field'; }

  static get modelData () {
    const { tableName, modelName, tableKeys } = Field;
    return { tableName, modelName, tableKeys };
  }

  static get tableKeys () {
    return {
      id:           { },
      user:         { required: true, relation: { model: User, allowId: true } },
      type:         { required: true },
      label:        { required: true },
      tabName:      { required: true },
      options:      { required: false },
      updatedAt: {}
    };
  }
  constructor (fieldData) {
    super(Field.modelData, fieldData);
  }
};

module.exports = exports = Field;

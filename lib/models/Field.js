const BaseModel = require('./_BaseModel');
const exampleFields = require('./exampleData/fields');
const debug = require("debug")("api:model:field");

class Field extends BaseModel {
  static get tableName() { return "fields" }
  static get exampleData() { return exampleFields; }
  static get tableKeys() {
    return {
      id:           { required: true },
      user:         { },
      type:         { required: true },
      label:        { required: true },
      tabName:      { required: true },
      optionValues: { required: false }
    };
  }
  static update(body, uid) {
    let data = this.sanitizeKeys(body);
    if (uid) {
      data = Object.assign(data, { user: uid });
    }
    return super.add(data)

  }
  static sanitizeKeys(data) {
    let sanitizedData = {};
    Object.keys(this.tableKeys).forEach(tableKey => {
      if (data[tableKey]) {
        sanitizedData[tableKey] = data[tableKey];
      }
    });
    return sanitizedData;
  }
  constructor(fields) {
    super(Field.tableName);
    if (fields) {
      this.fields = Field.sanitizeKeys(fields);
    }
  }
  save() {
    if (data.id) {
      super.update(this.fields);
    } else {
      super.add(this.fields);
    }
  }
};
module.exports = exports = Field;
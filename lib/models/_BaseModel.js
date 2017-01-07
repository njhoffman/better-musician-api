const getDbModule = require("../utils/db").getDbModule;
const _ = require("lodash");

class BaseModel {
  static get db() { return getDbModule().db; }
  static get conn() { return getDbModule().conn; }
  static getCount() {
    return this.db
      .table(this.tableName)
      .count()
      .run(this.conn);
  }
  static findById(id) {
    return this.db
      .table(this.tableName)
      .get(id)
      .coerceTo('object')
      .run(this.conn);
  }
  static getAll() {
    return this.db
      .table(this.tableName)
      .orderBy('id')
      .coerceTo('array')
      .run(this.conn);
  }
  static generate(num, mergeObj) {
    let exampleData = num && num > 0
      ? _.shuffle(this.exampleData).slice(0, num)
      : _.shuffle(this.exampleData);
    if (mergeObj) {
      exampleData = exampleData.map(data => {
        return Object.assign(data, mergeObj);
      });
    }
    return this.db
      .table(this.tableName)
      .insert(exampleData)
      .run(this.conn);
  }
  static empty() {
    return this.db
      .table(this.tableName)
      .delete()
      .run(this.conn)
  }
  static reset() {
    return this.empty().then(() => this.generate());
  }
}

module.exports = BaseModel;

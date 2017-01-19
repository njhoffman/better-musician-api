const getDbModule = require("../utils/db").getDbModule;
const _ = require("lodash");
const debug = require('debug')('api:baseModel');

class BaseModel {
  static get db() { return getDbModule().db; }
  static get conn() { return getDbModule().conn; }
  static get count() {
    return this.db
      .table(this.tableName)
      .count()
      .run(this.conn);
  }
  static get all() {
    return this.db
      .table(this.tableName)
      .orderBy('id')
      .coerceTo('array')
      .run(this.conn);
  }

  static findById(id) {
    return this.db
      .table(this.tableName)
      .get(id)
      .coerceTo('object')
      .run(this.conn);
  }
  static modelById(id) {
    return this.findById(id)
      .then(data => {
        debug('modelById %O', data);
        return new this(data);
      })
  }
  static findByField(field) {
    return this.db
      .table(this.tableName)
      .filter(field)
      .coerceTo('array')
      .run(this.conn);
  }
  static modelByField(field) {
    return this.findByField(field)
      .then(data => {
        debug('modelByField %s %O', field, data);
        return new this(data);
      })
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
      .run(this.conn)
      .then(results => {
        debug("Generated %s Records", results.inserted);
        return results;
      });
  }
  static update(data) {
    return this.db
      .table(this.tableName)
      .update(data)
      .run(this.conn)
      .then(res => {
        if (res.inserted === 1) {
          data.id = res.generated_keys[0];
          return data;
        } else {
          debug("ERROR Updating %O\n%O", data, res);
        }
      });
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

  constructor(tableName) {
    this.tableName = tableName;
  }

  get db() { return BaseModel.db }
  get conn() { return BaseModel.conn }

  delete() {
    debug('im trying %O', this );
    return this.db
      .table(this.tableName)
      .get(this.fields.id)
      .delete()
      .run(this.conn);
  }

  add() {
    return this.db
      .table(this.tableName)
      .insert(this.fields)
      .run(BaseModel.conn)
      .then((res) => {
        if (res.inserted === 1) {
          this.fields.id = res.generated_keys[0];
          return this.fields;
        } else {
          debug("ERROR Adding %O\n%O", this.fields, res);
        }
      });
  }
}

module.exports = BaseModel;

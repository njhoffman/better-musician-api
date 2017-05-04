const getDbModule = require('../utils/db').getDbModule;
const StatsD = require('node-statsd');
const sdc = new StatsD();
const _ = require('lodash');
const { log, error } = require('debugger-256')('api:baseModel');

class BaseModel {
  static get db () { return getDbModule().db; }
  static get conn () { return getDbModule().conn; }
  static get count () {
    return this.db
      .table(this.tableName)
      .count()
      .run(this.conn);
  }
  static get all () {
    sdc.increment('api_db_query');
    return this.db
      .table(this.tableName)
      .orderBy('id')
      .coerceTo('array')
      .run(this.conn);
  }

  static findById (id) {
    sdc.increment('api_db_query');
    return this.db
      .table(this.tableName)
      .get(id)
      .run(this.conn)
      .then(result => {
        return result || null;
      });
  }

  static modelById (id) {
    return this.findById(id)
      .then(data => {
        return data ? new this(data) : data;
      });
  }

  static findByField (field) {
    sdc.increment('api_db_query');
    return this.db
      .table(this.tableName)
      .filter(field)
      .coerceTo('array')
      .run(this.conn);
  }

  static modelByField (field) {
    return this.findByField(field)
      .then(data => {
        return new this(data);
      });
  }

  static generate (num = 0, mergeObj) {
    let exampleData = num > 0
      ? this.exampleData.slice(0, num)
      : this.exampleData;
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
        log(`Generated ${results.inserted} records`);
        return results;
      });
  }
  static empty () {
    return this.db
      .table(this.tableName)
      .delete()
      .run(this.conn);
  }
  static reset () {
    return this.empty().then(() => this.generate());
  }

  constructor (tableName) {
    this.tableName = tableName;
  }

  get db () { return BaseModel.db; }
  get conn () { return BaseModel.conn; }

  delete () {
    log('deleting model %O', this);
    return this.db
      .table(this.tableName)
      .get(this.fields.id)
      .delete()
      .run(this.conn);
  }

  update () {
    if (typeof this.fields.updatedAt.push === 'function') {
      this.fields.updatedAt.push(new Date().getTime()); ;
    }
    return this.db
      .table(this.tableName)
      .update(_.omit(this.fields, 'id'))
      .run(this.conn)
      .then(res => {
        if (res.errors === 0) {
          log('Successfully updated record', this);
          sdc.increment('api_db_update');
          return this;
        } else {
          error('ERROR Updating ', this.fields, res);
        }
      });
  }

  add () {
    this.fields.createdAt = new Date().getTime();
    this.fields.updatedAt = [new Date().getTime()];
    return this.db
      .table(this.tableName)
      .insert(this.fields)
      .run(this.conn)
      .then((res) => {
        if (res.errors === 0) {
          this.fields.id = res.generated_keys[0];
          log('Successfully added record', this);
          sdc.increment('api_db_add');
          return this;
        } else {
          error('ERROR Adding Record', this.fields, 'Error Response', res);
        }
      });
  }
}

module.exports = BaseModel;

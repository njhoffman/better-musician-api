const { getDbModule } = require('../utils/db');
const { existsSync } = require('fs');
const { resolve } = require('path');
const StatsD = require('node-statsd');
const sdc = new StatsD();
const { omit }  = require('lodash');
const { trace, log, info } = require('debugger-256')('api:baseModel');

class BaseModel {
  static get args () { return getDbModule().r.args; }
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

  static get seedData () {
    const envPath = resolve(`${__dirname}/seedData/${__NODE_ENV__}/${this.tableName}.js`);
    const defaultPath = resolve(`${__dirname}/seedData/default/${this.tableName}.js`);
    if (existsSync(envPath)) {
      return require(envPath);
    } else if (existsSync(defaultPath)) {
      return require(defaultPath);
    } else {
      throw new Error(`Cannot find seed data for table ${this.tableName} in
        ${envPath} or ${defaultPath}`);
    }
  }

  static findById (id) {
    sdc.increment('api_db_query');
    return this.db
      .table(this.tableName)
      .get(id)
      .run(this.conn);
  }

  static findByIds (ids) {
    sdc.increment('api_db_query');
    return this.db
      .table(this.tableName)
      .getAll(this.args(ids))
      .coerceTo('array')
      .run(this.conn);
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
      .run(this.conn).then(res => {
        return  res.length === 0 ? false
          : res.length == 1 ? res[0]
          : res;
      });
  }

  static modelByField (field) {
    return this.findByField(field)
      .then(data => {
        return new this(data);
      });
  }

  static createTable () {
    return this.db
      .tableCreate(this.tableName)
      .run(this.conn)
      .then(() => log(`Created ${this.tableName} table`));
  }

  static seed (num = 0, mergeObj) {
    let exampleData = num > 0
      ? this.seedData.slice(0, num)
      : this.seedData;

    if (mergeObj) {
      exampleData = exampleData.map(data => {
        return Object.assign(data, mergeObj);
      });
    }

    info(`Seeding records for table: ${this.tableName}, model: ${this.modelName}`);
    return this.db
      .table(this.tableName)
      .insert(exampleData)
      .run(this.conn)
      .then(results => {
        log(`Seeded ${results.inserted} records for model ${this.modelName}`);
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
    return this.empty().then(() => this.seed());
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
    if (this.fields.updatedAt) {
      this.fields.updatedAt.push(new Date().getTime()); ;
    }
    return this.db
      .table(this.tableName)
      .update(omit(this.fields, 'id'))
      .run(this.conn)
      .then(res => {
        if (res.errors === 0) {
          log('Successfully updated record', this);
          sdc.increment('api_db_update');
          return this;
        } else {
          throw new Error('ERROR Updating ', this.fields, res);
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
          throw new Error('ERROR Adding Record', this.fields, 'Error Response', res);
        }
      });
  }
}

module.exports = BaseModel;

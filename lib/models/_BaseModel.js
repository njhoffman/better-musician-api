const { getDbModule } = require('../utils/db');
const { existsSync } = require('fs');
const { resolve } = require('path');
const StatsD = require('node-statsd');
const sdc = new StatsD();
const { omit, omitBy, pick, pickBy, map, has }  = require('lodash');

const { info, debug, trace } = require('../utils/logger')('api:model:base');
const validator = require('./_BaseModel/validator');
const updater = require('./_BaseModel/updater');
const queries = require('./_BaseModel/queries');

class BaseModel {
  static get args () { return getDbModule().r.args; }
  static get db () { return getDbModule().db; }
  static get conn () { return getDbModule().conn; }

  static get foreignKeys () {
    return pickBy(this.tableKeys, (field) => { return field.relation !== undefined });
  }

  static get seedData () {
    const envPath = resolve(`${__dirname}/seedData/${global.__NODE_ENV__}/${this.tableName}.js`);
    const defaultPath = resolve(`${__dirname}/seedData/default/${this.tableName}.js`);
    // must invalidate cache to prevent mutations from tests
    if (existsSync(envPath)) {
      delete require.cache[require.resolve(envPath)];
      return require(envPath);
    } else if (existsSync(defaultPath)) {
      delete require.cache[require.resolve(defaultPath)];
      return require(defaultPath);
    } else {
      throw new Error(`Cannot find seed data for table ${this.tableName} in
        ${envPath} or ${defaultPath}`);
    }
  }

  static get all () {
    sdc.increment('api_db_query');
    return this.db
      .table(this.tableName)
      .orderBy('id')
      .coerceTo('array')
      .run(this.conn);
  }

  static get allDeep () {
    return this.all.then(records => {
      const recordIds = map(records, 'id');
      let queries = [];
      Object.keys(this.foreignKeys).forEach(key => {
        const { relation: { table, field = 'id' } } = this.foreignKeys[key];
        const query = this.allByField(field, recordIds, table);
        queries.push(Promise.all([query, { key, field }]));
      });
      queries.unshift(records);
      return Promise.all(queries)
    }).then(results => {
      let records = results[0];
      for (let i = 1; i < results.length; i++) {
        const fieldItems = results[i][0];
        const { key, field } = results[i][1];
        records = records.map(record => {
          record[key] = fieldItems.filter(fi => fi[field] === record.id);
          return record;
        });
      }
      return records;
    });
  }

  static get count () {
    return this.db
      .table(this.tableName)
      .count()
      .run(this.conn);
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
      // if merging in fields, remove id as we want a new record
      exampleData = exampleData.map(data => {
        delete data.id;
        return Object.assign(data, mergeObj);
      });
    }

    log(`Seeding records for table: ${this.tableName}, model: ${this.modelName} with ${Object.keys(exampleData).length} keys`);
    return this.db
      .table(this.tableName)
      .insert(exampleData)
      .run(this.conn)
      .then(res => {
        if (res.errors === 0) {
          info(`Seeded ${res.inserted} records for model ${this.modelName}`);
          return res;
        } else {
          throw new Error(`ERROR Seeding ${this.modelName}: ${res.first_error}`);
        }
      });
  }

  static empty () {
    return this.db
      .table(this.tableName)
      .delete()
      .run(this.conn)
      .then(res => {
        info(`Emptied ${res.deleted} records for model ${this.modelName}`);
      });
  }

  static reset () {
    return this.empty().then(() => this.seed());
  }

  static save (data, skipValidation) {
    return new this(data).save();
  }

  static delete (uniqueFields) {
    return this.db
      .table(this.tableName)
      .filter(uniqueFields)
      .delete()
      .run(this.conn)
      .then(res => {
        if (res.errors === 0) {
          log(`Deleted ${res.deleted} records for model ${this.modelName}`);
          return res;
        } else {
          throw new Error(`ERROR deleting ${this.modelName}: ${res.first_error}`);
        }
      });
  }

  constructor ({ tableName, tableKeys, modelName }, data, skipValidation = false) {
    this.warnings = [];
    this.errors = [];
    this.tableName = tableName;
    this.tableKeys = tableKeys;
    this.modelName = modelName;
    this.rawFields = data;
    this.skipValidation = skipValidation;
    this.cleanFields = data && data[0] ? data[0] : (data !== undefined ? data : null);
  }

  get db () { return BaseModel.db; }
  get conn () { return BaseModel.conn; }

  get cleanFields () {
    const hiddenFields = pickBy(this.tableKeys, (field) => { return field.hidden === true })
    return omit(this.fields, Object.keys(hiddenFields));
  }

  set cleanFields(fieldData) {
    if (!fieldData || Object.keys(fieldData).length === 0) {
      return;
    }
    const newFields = this.skipValidation ? fieldData : this.validateFields({...this.fields, ...fieldData });
    this.fields = this.populateDefaults(newFields);
  }

  populateDefaults (fields) {
    Object.keys(this.tableKeys).forEach(tableKey => {
      if (!has(fields, tableKey) && !has(this.fields, tableKey) && has(this.tableKeys, `${tableKey}.default`)) {
        fields[tableKey] = this.tableKeys[tableKey]['default'];
      }
    });
    return {...this.fields, ...fields};
  }

  delete () {
    log('deleting model %O', this);
    return this.db
      .table(this.tableName)
      .get(this.fields.id)
      .delete()
      .run(this.conn);
  }
}

BaseModel.prototype.validateFields = validator;
BaseModel.prototype.save = updater;
Object.assign(BaseModel, queries);

module.exports = BaseModel;

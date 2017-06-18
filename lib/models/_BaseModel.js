const { getDbModule } = require('../utils/db');
const { existsSync } = require('fs');
const { resolve } = require('path');
const StatsD = require('node-statsd');
const sdc = new StatsD();
const { omit, omitBy, pick, pickBy, map, has }  = require('lodash');
const { trace, log, info } = require('debugger-256')('api:baseModel');

class BaseModel {
  static get args () { return getDbModule().r.args; }
  static get db () { return getDbModule().db; }
  static get conn () { return getDbModule().conn; }

  static get foreignKeys () {
    return pickBy(this.tableKeys, (field) => { return field.fkey !== undefined });
  }

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

  static get allDeep () {
    return this.all.then(records => {
      const recordIds = map(records, 'id');
      let queries = [];
      Object.keys(this.foreignKeys).forEach(key => {
        const { fkey: { table, field } } = this.foreignKeys[key];
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

  static get seedData () {
    const envPath = resolve(`${__dirname}/seedData/${global.__NODE_ENV__}/${this.tableName}.js`);
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

  static allByField (fKey, fVals, tableName) {
    sdc.increment('api_db_query');
    return this.db
      .table(tableName || this.tableName)
      .filter(record => {
        return fVals.indexOf(record(fKey));
      })
      .coerceTo('array')
      .run(this.conn);
  }

  static findByField (field, tableName) {
    sdc.increment('api_db_query');
    return this.db
      .table(tableName || this.tableName)
      .filter(field)
      .coerceTo('array')
      .run(this.conn).then(res => {
        return  res.length === 0 ? false
          : res.length === 1 ? res[0]
          : res;
      });
  }

  static modelByField (field) {
    return this.findByField(field)
      .then(data => {
        return data ? new this(data) : data;
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
      .then(res => {
        if (res.errors === 0) {
          log(`Seeded ${res.inserted} records for model ${this.modelName}`);
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
      .run(this.conn);
  }

  static reset () {
    return this.empty().then(() => this.seed());
  }

  constructor (tableName, tableKeys, data) {
    this.tableName = tableName;
    this.tableKeys = tableKeys;
    this.cleanFields = data && data[0] ? data[0] : (data ? data : null);
  }

  get db () { return BaseModel.db; }
  get conn () { return BaseModel.conn; }

  get cleanFields () {
    const hiddenFields = pickBy(this.tableKeys, (field) => { return field.hidden === true })
    return omit(this.fields, Object.keys(hiddenFields));
  }

  set cleanFields(fieldData) {
    const newFields = this.sanitizeFields(fieldData);
    this.fields = this.populateDefaults(newFields);
  }

  sanitizeFields (fields) {
    // TODO: perform actual validation here
    return pick(fields, Object.keys(this.tableKeys));
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

  update () {
    if (this.fields.updatedAt) {
      this.fields.updatedAt.push(new Date().getTime()); ;
    }
    return this.db
      .table(this.tableName)
      .get(this.fields.id)
      .update(omit(this.fields, 'id'))
      .run(this.conn)
      .then(res => {
        if (res.errors === 0) {
					log(`Successfully updated ${res.replaced} records:`, this.fields);
          sdc.increment('api_db_update');
          return this.cleanFields;
        } else {
          throw new Error(`ERROR Updating: ${res.first_error}`);
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
          return this.cleanFields;
        } else {
          throw new Error(`ERROR Adding Record: ${res.first_error}`);
        }
      });
  }

  save (newFields) {
    this.cleanFields = newFields;
    if (this.fields.hasOwnProperty('id')) {
      return this.update();
    } else {
      return this.add();
    }
  }
}

module.exports = BaseModel;

const { omit, isEmpty, pickBy, has, keys, isArray, merge }  = require('lodash');
const { existsSync } = require('fs');
const { resolve } = require('path');
const deep = require('deep-diff');

const { getDbModule } = require('lib/utils/db');
const baseLogger = require('lib/utils/logger')('model:base');
const validator = require('./_BaseModel/validator');
const updater = require('./_BaseModel/updater');
const queries = require('./_BaseModel/queries');

/* BaseModel
 *   static methods/properties are generic table attributes and operations
 *   instantiated children refer to a single existing record of model from a query or create/update operation
 *   fields property refers to all saved fields
 *   cleanFields are non-sensitive, sanitized fields that should be used for server response
 *   setting cleanFields with data object performs validation on data before assigning to cleanFields and fields
*/

class BaseModel {
  static _status = {
    creating: false,
    updating: false,
    deleting: false
  };

  static get args() { return getDbModule().r.args; }

  static get row() { return getDbModule().r.row; }

  static get db() { return getDbModule().db; }

  static get conn() { return getDbModule().conn; }

  static get status() { return this._status; }

  static set status(newStatus) { this._status = newStatus; }

  static get foreignKeys() {
    return pickBy(this.tableKeys, (field) => field.relation !== undefined);
  }

  static get logger() {
    const meta = this.requestMetadata ? this.requestMetadata.loggerFields() : {};
    return baseLogger.child({ subsystem: 'baseModel', ...meta });
  }

  static initMetadata(metadata) {
    merge(this.requestMetadata, metadata);
  }

  // TODO: switch to dynamic imports
  /* eslint-disable global-require, import/no-dynamic-require */
  static get seedData() {
    const seedPath = resolve(`${__dirname}/seedData/${this.tableName}.js`);
    // must invalidate cache to prevent mutations from tests, need to use .default for dynamic require with babel7
    if (existsSync(seedPath)) {
      delete require.cache[require.resolve(seedPath)];
      return require(seedPath);
    }
    throw new Error(`Cannot find seed data for table ${this.tableName} in ${seedPath}`);
  }
  /* eslint-enable global-require, import/no-dynamic-require */

  static get count() {
    return this.db
      .table(this.tableName)
      .count()
      .run(this.conn);
  }

  static createTable() {
    return this.db
      .tableCreate(this.tableName)
      .run(this.conn)
      .then(() => this.logger.info(`Created ${this.tableName} table`));
  }

  static seed(num = 0, seedData = this.seedData) {
    this.status.creating = true;
    const data = num > 0 ? seedData.slice(0, num) : seedData;
    this.logger.info([
      `Seeding ${num > 0 ? num : ''}records for table: ${this.tableName}`,
      `model: ${this.modelName} (${keys(data).length} keys)`
    ].join(' '));

    return this.db
      .table(this.tableName)
      .insert(data, { returnChanges: true })
      .run(this.conn)
      .then(res => {
        this.status.creating = false;
        if (res.errors === 0) {
          this.logger.debug({
            _trace: { params: data, changes: res.changes },
            _dbOp: {
              data,
              operation: 'seed',
              table: this.tableName,
              resultCount: res.changes.length
            }
          }, `Seeded ${res.inserted} records for model ${this.modelName}`);

          return res;
        }
        throw new Error(`ERROR Seeding ${this.modelName}: ${res.first_error}`);
      });
  }

  static empty() {
    this.status.deleting = true;
    return this.db
      .table(this.tableName)
      .delete({ returnChanges: true })
      .run(this.conn)
      .then(res => {
        this.status.deleting = false;
        this.logger.debug({
          _dbOp: {
            operation: 'delete',
            table: this.tableName,
            resultCount: res.deleted
          }
        }, `Emptied ${res.deleted} records for model ${this.modelName}`);

        return res;
      });
  }

  static reset() {
    return this.empty()
      .then(() => this.seed());
  }

  static delete(uniqueFields) {
    this.status.deleting = true;
    return this.db
      .table(this.tableName)
      .filter(uniqueFields)
      .delete({ returnChanges: true })
      .run(this.conn)
      .then(res => {
        this.deleting = false;
        if (res.errors === 0) {
          const resultCount = res.changes ? res.changes.length : 0;
          this.logger.debug({
            _trace: { params: uniqueFields, changes: res.changes },
            _dbOp: {
              data: uniqueFields,
              operation: 'delete',
              table: this.tableName,
              resultCount
            }
          }, `Deleted ${res.deleted} records for model ${this.modelName}`);
          return res;
        }
        throw new Error(`ERROR deleting ${this.modelName}: ${res.first_error}`);
      });
  }

  static testUnique(fields) {
    const uniqueFields = pickBy(this.tableKeys, (tk, name) => (tk.unique || name === 'id'));
    keys(uniqueFields).forEach(uf => {
      if (fields[uf] !== undefined) {
        uniqueFields[uf] = fields[uf];
      }
    });

    if (has(fields, 'id')) {
      uniqueFields.id = fields.id;
    }

    return (
      keys(uniqueFields).length === 0
        ? Promise.resolve(true)
        : this.modelByField(uniqueFields)
    );
  }

  static save(data, skipValidation) {
    // search for existing records identified by unique field tags or 'id' field
    return this.testUnique(data)
      .then(existingModel => {
        if (!isEmpty(existingModel)) {
          return existingModel.save(data);
        }
        return new this(data).save();
      });
  }

  constructor({ tableName, tableKeys, modelName }, data = null, skipValidation = false) {
    // model is instantiated when returning a query or when populating with data to perform save operation
    // TODO: expand functionality to not depend on each table having ID prop to determine uniqueness
    this.warnings = [];
    this.errors = [];
    this.tableName = tableName;
    this.tableKeys = tableKeys;
    this.modelName = modelName;
    this.rawFields = data;
    this.skipValidation = skipValidation;
    this.cleanFields = isArray(data) ? data[0] : data;
    this.foreignKeys = this.constructor.foreignKeys;
    this.changed = { new: {}, old: {}, delta: {} };
  }

  get status() { return this.constructor.status; }

  set status(newStatus) { this.constructor.status = newStatus; }

  get logger() { return this.constructor.logger; }

  get db() { return this.constructor.db; }

  get conn() { return this.constructor.conn; }

  get row() { return this.constructor.row; }

  get deep() {
    const records = [{ ...this.fields }];
    const recordIds = [this.id];
    const lookups = [];

    keys(this.foreignKeys).forEach(key => {
      const { relation: { table, field = 'id' } } = this.foreignKeys[key];
      const query = this.constructor.allByField(field, recordIds, table);
      lookups.push(Promise.all([query, { key, field }]));
    });
    lookups.unshift(records);

    return Promise.all(lookups)
      .then(results => {
        let deepRecord = results[0];
        for (let i = 1; i < results.length; i += 1) {
          const fieldItems = results[i][0];
          const { key, field } = results[i][1];
          deepRecord = deepRecord.map(record => {
            const recordFields = fieldItems.filter(fi => fi[field] === record.id);
            return { ...record, [key]: recordFields };
          });
        }
        return deepRecord[0];
      });
  }

  get cleanFields() {
    const hiddenFields = pickBy(this.tableKeys, (field) => field.hidden === true);
    return omit(this.fields, keys(hiddenFields));
  }

  set cleanFields(fieldData) {
    if (!fieldData || keys(fieldData).length === 0) {
      return;
    }
    const newFields = this.skipValidation
      ? fieldData
      : this.validateFields({ ...this.fields, ...fieldData });

    this.fields = this.populateDefaults(newFields);
  }

  set changedFields(changes) {
    this.changed = {
      new: changes.new_val,
      old: changes.old_val,
      delta: deep.diff(changes.old_val, changes.new_val)
    };
  }

  populateDefaults(fields) {
    const defaultValues = {};
    keys(this.tableKeys).forEach(tableKey => {
      if (!has(fields, tableKey) && !has(this.fields, tableKey) && has(this.tableKeys, `${tableKey}.default`)) {
        defaultValues[tableKey] = this.tableKeys[tableKey].default;
      }
    });
    return { ...fields, ...defaultValues };
  }

  delete() {
    this.logger.info('deleting model %O', this);
    this.status.deleting = true;
    return this.db
      .table(this.tableName)
      .get(this.fields.id)
      .delete()
      .run(this.conn)
      .then(() => {
        this.status.deleting = false;
      });
  }
}

BaseModel.prototype.validateFields = validator;
BaseModel.prototype.save = updater;
Object.assign(BaseModel, queries);

module.exports = BaseModel;

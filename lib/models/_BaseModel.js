const {
  get, intersection, omit, find, isFunction,
  isEmpty, pickBy, has, keys, isArray, isObject
}  = require('lodash');

const { existsSync } = require('fs');
const { resolve: pathResolve } = require('path');
const deep = require('deep-diff');

const { AuthLockError } = require('lib/Errors');
const { getDbModule } = require('lib/utils/db');
const baseLogger = require('lib/utils/logger')('model:base');

const validator = require('./_BaseModel/validator');
const updater = require('./_BaseModel/updater');
const queries = require('./_BaseModel/queries');

/* BaseModel
 *   static methods/properties are generic table attributes and operations
 *   instantiated children refer to a single existing record of model from a query or create/update operation
 *   fields are non-sensitive, sanitized fields that should be used for server response
 *   setting fields with data object performs validation on data before assigning to fields
 *   TODO: come up with better terminology to differentiate between reverse/non-reverse foreign key relationships
 *   TODO : write better assertions with descriptive messages
 *   TODO: replace cleanFields with fields, use _fields private accessor, _password private accessor
*/


class BaseModel {
  static get args() { return getDbModule().r.args; }

  static get row() { return getDbModule().r.row; }

  static get db() { return getDbModule().db; }

  static get conn() { return getDbModule().conn; }

  static get userId() { return get(this, '_request.userId'); }

  static get userRoles() { return get(this, '_request.userRoles'); }

  static set request(metadata) { this._request = { ...this._request, ...metadata }; }

  static get request() { return this._request; }

  static get foreignKeys() {
    return pickBy(this.tableKeys, (field) => field.relation !== undefined);
  }

  static get logger() {
    const meta = this.request ? this.request.loggerFields() : {};
    return baseLogger.child({ subsystem: 'baseModel', ...meta });
  }

  static set fields(args) {
    throw new Error('Cannot set field values directly to the model');
  }

  // TODO: switch to dynamic imports
  /* eslint-disable global-require, import/no-dynamic-require */
  static get seedData() {
    const seedPath = pathResolve(`${__dirname}/seedData/${this.tableName}.js`);
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

  // TODO: find consolidated solution for instance/static changed / cleanFields parsing
  static changedFields(changes) {
    const changed = [];
    [].concat(changes).filter(Boolean)
      .forEach(change => {
        changed.push({
          new: change.new_val,
          old: change.old_val,
          delta: deep.diff(change.old_val, change.new_val)
        });
      });
    return changed;
  }


  static createTable() {
    return this.db
      .tableCreate(this.tableName)
      .run(this.conn)
      .then(() => this.logger.info(`Created ${this.tableName} table`));
  }

  static seed(num = 0, seedData = this.seedData) {
    const data = num > 0 ? seedData.slice(0, num) : seedData;

    this.logger.info([
      `Seeding ${num > 0 ? num : ''}records for table: ${this.tableName}`,
      `model: ${this.modelName} (${keys(data).length} keys)`
    ].join(' '));

    return this.db
      .table(this.tableName)
      .insert(data, { returnChanges: true })
      .run(this.conn)
      .then(results => {
        if (results.errors === 0) {
          this.logger.debug({
            _trace: { params: data, changed: results.changes },
            _dbOp: {
              data,
              operation: 'seed',
              table: this.tableName,
              resultCount: results.changes.length
            }
          }, `Seeded ${results.inserted} records for model ${this.modelName}`);
          return {
            ...omit(results, 'changes'),
            changed: this.changedFields(results.changes)
          };
        }
        throw new Error(`ERROR Seeding ${this.modelName}: ${results.first_error}`);
      });
  }

  static empty() {
    return this.db
      .table(this.tableName)
      .delete({ returnChanges: true })
      .run(this.conn)
      .then(results => {
        if (results.errors === 0) {
          this.logger.debug({
            _dbOp: {
              operation: 'delete',
              table: this.tableName,
              resultCount: results.deleted
            }
          }, `Emptied ${results.deleted} records for model ${this.modelName}`);

          return {
            ...omit(results, 'changes'),
            changed: this.changedFields(results.changes)
          };
        }
        throw new Error(`ERROR Emptying ${this.modelName}: ${results.first_error}`);
      });
  }

  static reset() {
    return this.empty()
      .then(() => this.seed());
  }

  static verifyAuthLock(fieldIds) {
    /* eslint-disable prefer-arrow-callback */
    return new Promise(function verifyAuthLock(resolve, reject) {
      // currently only works if "id" used as primary key
      // const userRoles = this.userRoles;
      const userRoles = ['user'];
      const { userId } = this;
      const authLocks = pickBy(this.tableKeys, 'authLock');
      const authVerifyFields = [];
      keys(authLocks).forEach((fieldName) => {
        const lockRoles = isArray(authLocks[fieldName].authLock)
          ? authLocks[fieldName].authLock : ['admin'];

        if (intersection(userRoles, lockRoles).length === 0) {
          authVerifyFields.push(fieldName);
        }
      });
      if (authVerifyFields.length === 0) {
        return resolve(true);
      }
      const fieldName = authVerifyFields.pop();
      const ids = isArray(fieldIds) ? fieldIds : [fieldIds.id];

      let authError = false;
      return this.findByIds(ids)
        .then(results => {
          results.forEach(result => {
            if ((result[fieldName]) !== userId) {
              authError = [
                `Not authorized removing record (${userId} !== ${result[fieldName]})`,
                `from ${this.modelName} with authLock setting and user role`
              ].join(' ');
            }
          });

          if (authError) {
            return reject(new AuthLockError(authError));
          }
          return resolve(true);
        });
    }.bind(this));
    /* eslint-enable prefer-arrow-callback */
  }

  static delete(id) {
    // accepts an object with unique fields to filter or a string to filter by id
    // TODO: handle deleting arrays of ids, arrays of objects
    const uniqueFields = isObject(id) ? id : { id };
    const self = this;
    return this.verifyAuthLock(uniqueFields)
      .then(() => (
        self.db.table(self.tableName)
          .filter(uniqueFields)
          .delete({ returnChanges: true })
          .run(self.conn)
          .then(results => {
            if (results.errors === 0) {
              const resultCount = results.changes ? results.changes.length : 0;
              self.logger.debug({
                _trace: { params: uniqueFields, changes: results.changes },
                _dbOp: {
                  data: uniqueFields,
                  operation: 'delete',
                  table: self.tableName,
                  resultCount
                }
              }, `Deleted ${results.deleted} records for model ${self.modelName}`);
              return {
                ...omit(results, 'changes'),
                changed: self.changedFields(results.changes)
              };
            }
            throw new Error(`ERROR deleting ${self.modelName}: ${results.first_error}`);
          })
      ));
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

  static save(data) {
    // search for existing records identified by unique field tags or 'id' field
    return this.testUnique(data)
      .then(existingModel => {
        if (!isEmpty(existingModel)) {
          return existingModel.save(data);
        }
        // instantiates new model for creating
        return new this(data).save();
      });
  }

  constructor({ tableName, tableKeys, modelName }, data = null, recordExists) {
    // model is instantiated when returning a query or when populating with data to perform save operation
    // TODO: expand functionality to not depend on each table having ID prop to determine uniqueness
    // this.warnings = [];
    // this.errors = [];
    const fieldData = [].concat(data)[0];

    this.tableName = tableName;
    this.tableKeys = tableKeys;
    this.modelName = modelName;
    //
    // const newFields = this.populateDefaults(fieldData);
    // if data is from existing record, just assign to field and skip validation/processing
    if (recordExists) {
      this.existingFields = fieldData;
    } else {
      this.validate(this.populateDefaults(fieldData));
    }
  }

  get changedFields() { return this.constructor.changedFields; }

  get foreignKeys() { return this.constructor.foreignKeys; }

  get logger() { return this.constructor.logger; }

  get userId() { return this.constructor.userId; }

  get userRoles() { return this.constructor.userRoles; }

  get db() { return this.constructor.db; }

  get conn() { return this.constructor.conn; }

  get row() { return this.constructor.row; }

  get fields() {
    const hiddenFields = pickBy(this.tableKeys, (field) => field.hidden === true);
    return omit(this._fields, keys(hiddenFields));
  }

  set fields(newFields) { this.constructor.fields = newFields; }

  // should only be set in constructor
  get validatedFields() { return this._validatedFields; }

  set warnings(warnings) { this._warnings = warnings; }

  get warnings() { return this._warnings; }

  set errors(errors) { this._errors = errors; }

  get errors() { return this._errors; }

  set existingFields(fields) {
    // should only be set within BaseModel when field updated or constructed with existing record
    this._existingFields = fields;
    this._fields = fields;
  }

  get deepFields() { return this._deepFields; }

  set deepFields(fields) { this._deepFields = fields; }

  get processedFields() { return this._processedFields; }

  set processedFields(fields) { this._processedFields = fields; }

  // should only be set in constructor
  get rawFields() { return this._rawFields; }

  get history() { return this._history; }

  set history(data) {
    this._history = this._history
      ? this._history.push(data)
      : [data];
  }

  get request() { return this.constructor.request; }

  set request(reqData) { this.constructor.request = reqData; }

  validate(fields) {
    this._rawFields = fields;

    this.logger.debug({ _trace: { fields } },
      `Validating: ${this.tableName} (${keys(fields).length} fields)`);

    const { validated, warnings, errors } =  this.validateFields(fields);

    if (warnings.length > 0) {
      warnings.filter(Boolean).forEach(w => {
        this.logger.warn(`Validation Warning: ${w.type} - "${w.field}"`);
        this.logger.warn({ fields }, `  -- ${w.message}`);
      });
      this.warnings = [].concat(this.warnings, warnings);
    }

    if (errors.length > 0) {
      errors.filter(Boolean).forEach(e => {
        this.logger.error(`Validation Error: ${e.type} - "${e.field}"`);
        this.logger.error({ fields }, `  -- ${e.message}`);
      });
      this.errors = [].concat(this.errors, errors);
    }

    this._validatedFields = validated;

    this.logger.trace({ warnings, errors, validated },
      `Finished validating ${keys(validated).length} fields for "${this.tableName}"`);
  }

  resetFields(newFields) {
    delete this._rawFields;
    delete this._validatedFields;
    delete this._processedFields;
    this._fields = newFields;
  }

  updateSavedData(response) {
    this.history = pickBy({
      existingFields:  this.existingFields,
      processedFields: this.processedFields,
      rawFields:       this.rawFields,
      deepFields:      this.deepFields,
      ...response
    });
    this.resetFields(response.records);
    return this.deep();
  }

  deep() {
    const { id } = this.fields;
    const self = this;
    return this.constructor.allDeep()
      .then(deepModelData => find(deepModelData, { id }))
      .then(deepFields => {
        self.deepFields = deepFields;
        return deepFields;
      });
  }

  populateDefaults(fields) {
    const defaultValues = {};
    keys(pickBy(this.tableKeys, 'default')).forEach(tKey => {
      const field = this.tableKeys[tKey];
      if (!has(fields, tKey) && !has(fields, tKey)) {
        defaultValues[tKey] = isFunction(field.default)
          ? field.default() : field.default;
      }
    });
    return { ...fields, ...defaultValues };
  }

  delete(id) {
    this.logger.info('deleting model %O', this);
    return this.db
      .table(this.tableName)
      .get(id || this.fields.id)
      .delete()
      .run(this.conn);
  }
}

BaseModel.prototype.validateFields = validator;
BaseModel.prototype.save = updater;
Object.assign(BaseModel, queries);
// BaseModel.all = queries.all;

module.exports = BaseModel;

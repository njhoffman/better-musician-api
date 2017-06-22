const { getDbModule } = require('../utils/db');
const { existsSync } = require('fs');
const { resolve } = require('path');
const StatsD = require('node-statsd');
const sdc = new StatsD();
const { omit, omitBy, pick, pickBy, map, has }  = require('lodash');
const { trace, log, info } = require('debugger-256')('api:baseModel');
const validator = require('./_BaseModel/validator');
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
    if (existsSync(envPath)) {
      return require(envPath);
    } else if (existsSync(defaultPath)) {
      return require(defaultPath);
    } else {
      throw new Error(`Cannot find seed data for table ${this.tableName} in
        ${envPath} or ${defaultPath}`);
    }
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

  static get all () {
    sdc.increment('api_db_query');
    return this.db
      .table(this.tableName)
      .orderBy('id')
      .coerceTo('array')
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

  processFieldsToSave() {
    let toSave = pick(this.fields, Object.keys(
      pickBy(this.tableKeys, (field) => field.relation === undefined )
    ));
    const fKeys = pickBy(this.tableKeys, (field) =>
      field.relation !== undefined && !field.relation.reverse);
    const foreignLookups = [];

    Object.keys(fKeys).forEach(fKey => {
      if (Object.keys(this.rawFields).indexOf(fKey) !== -1) {
        const dataObj = typeof this.fields[fKey] === 'object' ? this.fields[fKey] : { id: this.fields[fKey] };
        const fModel = new this.tableKeys[fKey].relation.model(dataObj, true);
        fModel.allowId = this.tableKeys[fKey].relation.allowId;
        // already validated, just save
        foreignLookups.push(Promise.all([fModel.save({}), fKey]));
      }
    });

    return Promise.all(foreignLookups).then(saveResults => {
      saveResults.forEach(sr => {
        toSave[sr[1]] = sr[0].id;
      });

      return { fields: toSave };
    });
    // return Promise.resolve({ fields: this.fields });
  }

  populateDefaults (fields) {
    Object.keys(this.tableKeys).forEach(tableKey => {
      if (!has(fields, tableKey) && !has(this.fields, tableKey) && has(this.tableKeys, `${tableKey}.default`)) {
        fields[tableKey] = this.tableKeys[tableKey]['default'];
      }
    });
    return {...this.fields, ...fields};
  }

  testUnique () {
    const uniqueFields = pickBy(this.tableKeys, { unique: true });
    Object.keys(uniqueFields).forEach(uf => {
      uniqueFields[uf] = this.fields[uf];
    });
    if (this.fields && this.fields.id !== undefined) {
      uniqueFields.id = this.fields.id;
    }
    return (Object.keys(uniqueFields).length === 0 ?
      Promise.resolve(true) : this.constructor.findByField(uniqueFields)
    );
  }

  delete () {
    log('deleting model %O', this);
    return this.db
      .table(this.tableName)
      .get(this.fields.id)
      .delete()
      .run(this.conn);
  }

  _update (saveFields) {
    if (this.tableKeys.updatedAt !== undefined) {
      saveFields.updatedAt = saveFields.updatedAt === undefined ?
        [new Date().getTime()] : saveFields.updatedAt.concat(new Date().getTime);
    }
    return this.db
      .table(this.tableName)
      .get(saveFields.id)
      .update(omit(saveFields, 'id'))
      .run(this.conn)
      .then(res => {
        if (res.errors === 0) {
          this.fields = { ...this.fields, ...saveFields };
					log(`Successfully updated ${res.replaced} records:`, saveFields);
          sdc.increment('api_db_update');
          return this.cleanFields;
        } else {
          throw new Error(`ERROR Updating: ${res.first_error}`);
        }
      });
  }

  _add (saveFields) {
    if (this.tableKeys.createdAt !== undefined) {
      saveFields.createdAt = new Date().getTime();
    }
    if (this.tableKeys.updatedAt !== undefined) {
      saveFields.updatedAt = saveFields.updatedAt === undefined ?
        [new Date().getTime()] : saveFields.updatedAt.concat(new Date().getTime);
    }

    return this.db
      .table(this.tableName)
      .insert(saveFields)
      .run(this.conn)
      .then((res) => {
        if (res.errors === 0) {
          this.fields = { ...this.fields, ...saveFields };
          this.fields.id = res.generated_keys[0];
          log('Successfully added record', saveFields);
          sdc.increment('api_db_add');
          return this.cleanFields;
        } else {
          throw new Error(`ERROR Adding Record: ${res.first_error}`);
        }
      });
  }

  save (newFields) {
    // performs validation
    this.cleanFields = newFields;
    this.rawFields = { ...this.rawFields, ...newFields };
    return this.testUnique()
      .then((uniqueRes) => {
        if (uniqueRes.id !== undefined) {
          this.fields.id = uniqueRes.id;
        }
        if (typeof uniqueRes === 'object' && (JSON.stringify(uniqueRes) === JSON.stringify(this.cleanFields))) {
          // if unique result already exists with matching fields, no need to save
          this.cleanFields = uniqueRes;
          // console.log("\n\nUniqueRes ", this.tableName, ":\n", uniqueRes, '\n\n\n');
          return this.cleanFields;
        } else {
          return this.processFieldsToSave()
            .then(({ fields, errors }) => {
              if (errors && errors.length !== 0) {
                console.log('There is an error you stupid motherfucker ' + errors[0]);
              }
              if (fields.hasOwnProperty('id')) {
                return this._update(fields);
              } else {
                return this._add(fields);
              }
            });
        }
      });
  }
}

BaseModel.prototype.validateFields = validator;
Object.assign(BaseModel, queries);

module.exports = BaseModel;

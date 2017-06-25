const { pick, pickBy, omit } = require('lodash');
const StatsD = require('node-statsd');
const sdc = new StatsD();

const { trace, log, info } = require('debugger-256')('api:baseModel:updater');

const  _processFieldsToSave = function() {
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
};

const _testUnique = function() {
  const uniqueFields = pickBy(this.tableKeys, { unique: true });
  Object.keys(uniqueFields).forEach(uf => {
    if (this.fields[uf] !== undefined) {
      uniqueFields[uf] = this.fields[uf];
    }
  });
  if (this.fields && this.fields.id !== undefined) {
    uniqueFields.id = this.fields.id;
  }
  return (Object.keys(uniqueFields).length === 0 ?
    Promise.resolve(true) : this.constructor.findByField(uniqueFields)
  );
};

const _update = function(saveFields) {
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
        log(`Successfully updated record for model %${this.modelName}%`, { color: 'lightCyan' });
        info(this.cleanFields);
        sdc.increment('api_db_update');
        return this.cleanFields;
      } else {
        throw new Error(`ERROR Updating: ${res.first_error}`);
      }
    });
};

const _add = function(saveFields) {
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
        log(`Successfully added record to model %${this.modelName}%`, { color: 'lightCyan' });
        info(this.cleanFields);
        sdc.increment('api_db_add');
        return this.cleanFields;
      } else {
        throw new Error(`ERROR Adding Record: ${res.first_error}`);
      }
    });
};

const save = function(newFields) {
  // performs validation
  this.cleanFields = newFields;
  this.rawFields = { ...this.rawFields, ...newFields };
  return _testUnique.call(this)
    .then((uniqueRes) => {
      if (uniqueRes.id !== undefined) {
        this.fields.id = uniqueRes.id;
      }
      if (typeof uniqueRes === 'object' && (JSON.stringify(uniqueRes) === JSON.stringify(this.cleanFields))) {
        // if unique result already exists with matching fields, no need to save
        this.cleanFields = uniqueRes;
        return this.cleanFields;
      } else {
        return _processFieldsToSave.call(this)
          .then(({ fields }) => {
            if (fields.hasOwnProperty('id')) {
              return _update.call(this, fields);
            } else {
              return _add.call(this, fields);
            }
          });
      }
    });
}

module.exports = exports = save;
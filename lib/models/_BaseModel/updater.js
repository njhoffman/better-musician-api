const { pick, pickBy, keys, has } = require('lodash');
const StatsD = require('node-statsd');

const sdc = new StatsD();

const _update = function _update(saveFields, existingId) {
  this.status.updating = true;

  const toSave = {
    ...saveFields,
    updatedAt: this.row('updatedAt').append({
      // TODO pass along and save userID
      time: new Date().getTime()
    })
  };

  return this.db
    .table(this.tableName)
    .get(existingId)
    .update(toSave, { returnChanges: true })
    .run(this.conn)
    .then(res => {
      const { changes, errors } = res;
      this.status.updating = false;
      if (errors && errors.length > 0) {
        throw new Error(`ERROR updating Record: ${res.first_error}`);
      } else if (changes.length > 1) {
        throw new Error(`Error: Attempt to update multiple records for ${this.tableName}`, changes);
      } else {
        sdc.increment('api_db_update');
        this.changedFields = [].concat(changes).pop();
        return { type: 'update', key: saveFields.id, changes, ...res };
      }
    });
};

const _add = function _add() {
  this.status.creating = true;

  // record creation needs all associated fields for the first save
  const toAdd = {
    ...this.fields,
    createdAt: new Date().getTime()
  };

  return this.db
    .table(this.tableName)
    .insert(toAdd, { returnChanges: true })
    .run(this.conn)
    .then((res) => {
      this.status.creating = false;
      const { generated_keys: [id], changes, errors } = res;
      if (errors === 0) {
        this.fields.id = id;
        this.changedFields = [].concat(changes).pop();
        sdc.increment('api_db_create');
        return { type: 'create', key: id, changes, ...res };
      } else if (changes && changes.length > 1) {
        throw new Error(`Error: Attempt to add multiple records for ${this.tableName}`, changes);
      } else {
        throw new Error(`ERROR Adding Record: ${res.first_error}`);
      }
    });
};

const _logResult = function _logResult(res, newFields) {
  const { type, inserted, replaced, skipped, unchanged, changes } = res;

  const logMessage = [
    'Successfully',
    `${replaced ? 'replaced ' : ''}${replaced || ''}`,
    `${inserted ? 'inserted ' : ''}${inserted || ''}`,
    `${skipped || unchanged ? ' (' : ''}`,
    `${skipped || ''}${skipped ? 'skipped' : ''}`,
    `${unchanged || ''}${unchanged ? ' unchanged' : ''}`,
    `${skipped || unchanged ? ') ' : ''}`,
    `${this.changed.delta.length} total field changes, `,
    `record(s) during ${type} operation for model %${this.modelName}%`
  ].filter(Boolean).join(' ');

  this.logger.debug({
    _trace: { fields: this.cleanFields, data: newFields, changed: this.changed },
    _dbOp: {
      data:  newFields,
      operation: type,
      table: this.tableName,
      resultCount: changes.length,
      changed: this.changed
    }
  }, logMessage);

  return Promise.resolve();
};

const _doOperation = function _doOperation(fieldsToUpdate) {
  // TODO: use getAll if secondary indexes are used
  // currently each table must have id which determines whether update/insert operation
  if (this.fields && this.fields.id) {
    return _update.call(this, fieldsToUpdate, this.fields.id);
  }
  return _add.call(this);
};

const _processFields = function _processFieldsTosSave(newFields) {
  // only save keys defined in class model
  const nfKeys = keys(newFields).filter(nfKey => !this.tableKeys[nfKey] || !this.tableKeys[nfKey].relation);

  const fieldsToUpdate = pick(this.fields, nfKeys);

  const fKeys = pickBy(this.tableKeys, (field, fieldKey) => (
    field.relation && has(newFields, fieldKey) && !field.relation.reverse
  ));

  const foreignLookups = [];
  keys(fKeys).forEach(fKey => {
    if (keys(this.rawFields).indexOf(fKey) !== -1) {
      const dataObj = typeof this.fields[fKey] === 'object' ? this.fields[fKey] : { id: this.fields[fKey] };
      const fModel = new this.tableKeys[fKey].relation.Model(dataObj, true);
      fModel.allowId = this.tableKeys[fKey].relation.allowId;
      // already validated, just save
      foreignLookups.push(Promise.all([fModel.save({}), fKey]));
    }
  });

  // save foreign key records and assign new foreign id to relation field
  return Promise.all(foreignLookups)
    .then(fkeySaves => {
      fkeySaves.forEach(([saveResult, fKey]) => {
        const { records: { id } } = saveResult;
        fieldsToUpdate[fKey] = id;
      });
      return Promise.resolve(fieldsToUpdate);
    });
};


const _doValidation = function _doValidation(newFields) {
  // performs validation
  this.rawFields = { ...this.rawFields, ...newFields };
  this.cleanFields = newFields;

  if (this.errors.length > 0) {
    return Promise.resolve({ errors: this.errors });
  }
  return Promise.resolve(newFields);
};

const Save = function Save(newFields) {
  return _doValidation.call(this, newFields)
    .then(() => _processFields.call(this, newFields))
    .then((fieldsToUpdate) => _doOperation.call(this, fieldsToUpdate))
    .then(res => _logResult.call(this, res, newFields))
    .then(() => ({ records: this.cleanFields, changed: this.changed }));
};


module.exports = Save;

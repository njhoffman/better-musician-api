const { get, pick, omit, isObject, merge, pickBy, keys, has } = require('lodash');
// const StatsD = require('node-statsd');
const Promise = require('bluebird');

// const sdc = new StatsD();

const _logResult = function _logResult(results, newFields) {
  const { type, inserted, replaced, skipped, unchanged, changes = [] } = results;

  const logMessage = [
    'Successfully',
    `${replaced ? 'replaced ' : ''}${replaced || ''}`,
    `${inserted ? 'inserted ' : ''}${inserted || ''}`,
    `${skipped || unchanged ? ' (' : ''}`,
    `${skipped || ''}${skipped ? 'skipped' : ''}`,
    `${unchanged || ''}${unchanged ? ' unchanged' : ''}`,
    `${skipped || unchanged ? ') ' : ''}`,
    `${changes.length} total field changes, `,
    `record(s) during ${type} operation for model %${this.modelName}%`
  ].filter(Boolean).join(' ');

  this.logger.debug({
    _trace: { fields: this.fields, data: newFields, changes },
    _dbOp: {
      table:       this.tableName,
      data:        newFields,
      operation:   inserted ? 'create' : 'update',
      resultCount: changes.length,
      changes
    }
  }, logMessage);

  return Promise.resolve(results);
};

const _update = function _update(saveFields, existingId) {
  const toSave = {
    ...omit(saveFields, ['updatedAt', 'id']),
    updatedAt: new Date().getTime()
  };

  this.logger.debug({ _trace: toSave },
    `Attempting to UPDATE "${this.tableName}" record: ${existingId}`);

  return this.db
    .table(this.tableName)
    .get(existingId)
    .update(toSave, { returnChanges: true })
    .run(this.conn);
};

const _create = function _create(fieldsToAdd) {
  // record creation needs all associated fields for the first save
  const toAdd = {
    ...fieldsToAdd,
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  };

  this.logger.debug(
    { _debug: toAdd },
    `Attempting to CREATE "${this.tableName}" record`
  );
  return this.db
    .table(this.tableName)
    .insert(toAdd, { returnChanges: true })
    .run(this.conn);
};

const _createForeignRelation = function _createForeignRelation(fKey) {
  if (has(this.rawFields, fKey)) {
    const { relation: { Model } } = this.tableKeys[fKey];

    const dataObj = isObject(this.validatedFields[fKey])
      ? this.validatedFields[fKey]
      : { id: this.validatedFields[fKey] };

    const fModel = new Model(dataObj);
    fModel.parentField = fKey;
    return fModel;
  }
  return false;
};

const _processIncomingFields = function _processIncomingFields(newFields) {
  // only save keys defined in class model
  const fieldsToUpdate = pick(this.validatedFields, (
    keys(this.validatedFields)
      .filter(vKey => !has(this.tableKeys, vKey.relation))
  ));
  // reverse relations are for reference/seeding purposes only not normal saing
  const fKeys = pickBy(this.tableKeys, (field, fieldKey) => (
    has(field, 'relation') && has(newFields, fieldKey)
    // && !field.relation.reverse
  ));

  const foreignModels = keys(fKeys)
    .map(fKey => _createForeignRelation.call(this, fKey))
    .filter(Boolean);

  const self = this;
  // save foreign key records and assign new foreign id to relation field
  return Promise.mapSeries(foreignModels, fModel => (
    Promise.all([fModel.constructor.save(fModel.rawFields), fModel.parentField])
  ))
    .then(fKeySaves => {
      fKeySaves.forEach(([saveResult, fKey]) => {
        const { records: { id } } = saveResult;
        fieldsToUpdate[fKey] = id;
      });

      self.processedFields = fieldsToUpdate;
      return fieldsToUpdate;
    });
};

const _handleUpdate = function _handleUpdate(newFields, existingId) {
  // return _doValidation.call(this, newFields)
  // .then(() => _processFields.call(this, newFields))
  return _processIncomingFields.call(this, newFields)
    .then((toUpdate) => _update.call(this, toUpdate, existingId));
};

const _handleCreate = function _handleCreate(newFields) {
  const self = this;
  return _processIncomingFields
    .call(this, { ...this.validatedFields, newFields })
    .then((toCreate) => _create.call(self, toCreate));
};

const _handleResponse = function _handleResponse(results) {
  const { generated_keys: [id] = [], changes, errors, ...other } = results;
  // genereated_keys: [id]
  // sdc.increment('api_db_create');

  if (errors && errors > 0) {
    throw new Error(`ERROR updating Record: ${other.first_error}`);
  } else if (changes.length > 1) {
    throw new Error(`Error: Attempt to update multiple records for ${this.tableName}`, changes);
  }

  // assign main fields property now that data has been saved
  // this.existingFields = this.cleanedFields;
  const changed = this.changedFields(changes);
  const records = changed[0] ? changed[0].new : {};
  const response = {
    parentField: this.parentField,
    records,
    changed,
    ...other
  };

  if (id) {
    merge(response, { id, operation: 'create' });
  } else {
    merge(response, { operation: 'update' });
  }

  this.updateSavedData(response);
  return response;
};

const Save = function Save(newFields) {
  // existing models for update should be instantiated and updated with newFields
  // new models for create need to be instantiated for validation and parsing
  // instantiation from an update or create always guarantees uniqueness and corret update or create path
  this.logger.debug(
    { _debug: { newFields, rawFields: this.rawFields } },
    `Trying to save data to ${this.modelName}`
  );

  if (newFields) {
    this.validate({ ...this.existingFields, ...newFields });
  }

  const existingId = get(newFields, 'id')
    || get(this.validatedFields, 'id')
    || get(this.existingFields, 'id');

  return (existingId
    ? _handleUpdate.call(this, newFields, existingId)
    : _handleCreate.call(this))
    .then(results => _logResult.call(this, results, newFields))
    .then(results => _handleResponse.call(this, results));
};

module.exports = Save;

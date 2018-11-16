const { pick, pickBy, omit, keys, has } = require('lodash');
const StatsD = require('node-statsd');

const sdc = new StatsD();

const _processFieldsToSave = function _processFieldsTosSave(newFields) {
  // only save keys defined in class model
  const nfKeys = keys(newFields).filter(nfKey => !this.tableKeys[nfKey].relation);

  const toSave = pick(
    this.fields,
    nfKeys
  );
  const fKeys = pickBy(this.tableKeys, (field, fieldKey) => (
    field.relation
      && has(newFields, fieldKey)
      && !field.relation.reverse
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

  return Promise.all(foreignLookups)
    .then(saveResults => {
      saveResults.forEach(sr => {
        toSave[sr[1]] = sr[0].id;
      });
      return { fields: toSave };
    });
};

const _testUnique = function _testUnique() {
  // enforce record atomicity if fields has unique bool set
  const uniqueFields = pickBy(this.tableKeys, { unique: true });
  keys(uniqueFields).forEach(uf => {
    if (this.fields[uf] !== undefined) {
      uniqueFields[uf] = this.fields[uf];
    }
  });

  if (has(this.fields, 'id')) {
    uniqueFields.id = this.fields.id;
  }

  return (
    keys(uniqueFields).length === 0
      ? Promise.resolve(true)
      : this.constructor.findByField(uniqueFields)
  );
};

const _update = function _update(saveFields) {
  const toSave = {
    ...omit(saveFields, 'id'),
    updatedAt: this.row('updatedAt').append({
      // TODO pass along and save userID
      time: new Date().getTime()
    })
  };

  return this.db
    .table(this.tableName)
    .get(saveFields.id)
    .update(toSave, { returnChanges: true })
    .run(this.conn)
    .then(res => {
      if (res.errors === 0) {
        const { inserted, replaced, skipped, unchanged, changes } = res;

        if (changes.length > 1) {
          this.logger.error({ changes }, `Error: Attempt to update multiple records for ${this.tableName}`);
        }
        this.changedFields = [].concat(changes).pop();

        const msg =  [
          `${replaced ? 'Replaced ' : ''}${replaced || ''}`,
          `${inserted ? 'Inserted ' : ''}${inserted || ''}`,
          `${skipped || unchanged ? ' (' : ''}`,
          `${skipped || ''}${skipped ? 'skipped' : ''}`,
          `${unchanged || ''}${unchanged ? ' unchanged' : ''}`,
          `${skipped || unchanged ? ') ' : ''}`,
          `${this.changed.delta.length} total field changes, `,
          `record(s) for model %${this.modelName}%`
        ].filter(Boolean).join(' ');

        this.logger.debug({
          _trace: { fields: this.cleanFields, params: toSave, changed: this.changed },
          _dbOp: {
            data: toSave,
            operation: 'update',
            table: this.tableName,
            params: saveFields,
            resultCount: changes.length,
            changed: this.changed,
            name: replaced ? 'replace' : 'insert'
          }
        }, msg);
        // this.logger.debug({ fields: this.cleanFields });
        this.warnings.forEach(w => (
          this.logger.warn(`Validation Warning: ${w.type} for field ${w.field}: ${w.message}`)
        ));
        sdc.increment('api_db_update');
        return { fields: this.cleanFields, changed: this.changed };
      }
      throw new Error(`ERROR Updating: ${res.first_error}`);
    });
};

const _add = function _add(saveFields) {
  const toAdd = { ...saveFields, createdAt: new Date().getTime() };

  return this.db
    .table(this.tableName)
    .insert(toAdd, { returnChanges: true })
    .run(this.conn)
    .then((res) => {
      if (res.errors === 0) {
        const { generated_keys: [id], changes } = res;
        this.fields.id = id;
        if (changes.length > 1) {
          this.logger.error({ changes }, `Error: Attempt to add multiple records for ${this.tableName}`);
        }
        this.changedFields = [].concat(changes).pop();

        this.logger.debug({
          _trace: { fields: this.cleanFields, params: toAdd, changed: this.changed },
          _dbOp: {
            data: toAdd,
            operation: 'insert',
            table: this.tableName,
            resultCount: changes.length,
            params: toAdd,
            changed: this.changed
          }
        }, `Successfully inserted ${res.inserted} record into model %${this.modelName}%`);

        if (this.warnings.length > 0) {
          this.logger.warn('Warnings', this.warnings);
        }
        sdc.increment('api_db_add');
        return { fields: this.cleanFields, changed: this.changed };
      }
      throw new Error(`ERROR Adding Record: ${res.first_error}`);
    });
};

const Save = function Save(newFields) {
  // performs validation
  this.rawFields = { ...this.rawFields, ...newFields };
  this.cleanFields = newFields;
  if (this.errors.length > 0) {
    return Promise.resolve({ errors: this.errors });
  }

  return _testUnique.call(this)
    .then(([foundRecord]) => {
      if (typeof foundRecord === 'object' && (JSON.stringify(foundRecord) === JSON.stringify(this.cleanFields))) {
        // if unique result already exists with matching fields, no need to save
        this.cleanFields = foundRecord;
        return this.cleanFields;
      }

      return _processFieldsToSave.call(this, newFields)
        .then((fieldsToUpdate) => {
          if (foundRecord) {
            return _update.call(this, { ...fieldsToUpdate, id: foundRecord.id });
          }
          return _add.call(this, fieldsToUpdate);
        });
    });
};

module.exports = Save;

const { pick, pickBy, omit, keys, has } = require('lodash');
const StatsD = require('node-statsd');
const { warn, info, debug } = require('lib/utils/logger')('BaseModel:updater');

const sdc = new StatsD();

const _processFieldsToSave = function _processFieldsTosSave() {
  const toSave = pick(this.fields, keys(
    pickBy(this.tableKeys, (field) => field.relation === undefined)
  ));
  const fKeys = pickBy(this.tableKeys, (field) =>
    field.relation !== undefined && !field.relation.reverse);
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
  const uniqueFields = pickBy(this.tableKeys, { unique: true });
  keys(uniqueFields).forEach(uf => {
    if (this.fields[uf] !== undefined) {
      uniqueFields[uf] = this.fields[uf];
    }
  });
  if (this.fields && this.fields.id !== undefined) {
    uniqueFields.id = this.fields.id;
  }
  return (keys(uniqueFields).length === 0
    ? Promise.resolve(true)
    : this.constructor.findByField(uniqueFields)
  );
};

const _update = function _update(saveFields) {
  return this.db
    .table(this.tableName)
    .get(saveFields.id)
    .update({
      ...omit(saveFields, 'id'),
      updatedAt: this.row('updatedAt').append({ time: new Date().getTime() })
    })
    .run(this.conn)
    .then(res => {
      if (res.errors === 0) {
        this.fields = { ...this.fields, ...saveFields };
        const { inserted, replaced, skipped, unchanged } = res;
        debug(
          { color: 'bold' },
          [
            'Successfully',
            `${replaced ? 'replaced ' : ''}${replaced || ''}`,
            `${inserted ? 'inserted ' : ''}${inserted || ''}`,
            `${skipped || unchanged ? ' (' : ''}`,
            `${skipped || ''}${skipped ? 'skipped' : ''}`,
            `${unchanged || ''}${unchanged ? ' unchanged' : ''}`,
            `${skipped || unchanged ? ') ' : ''}`,
            `record(s) for model %${this.modelName}%`
          ].filter(Boolean).join(' ')
        );
        info({ fields: this.cleanFields });
        this.warnings.forEach(w => warn(`Validation Warning: ${w.type} for field ${w.field}: ${w.message}`));
        sdc.increment('api_db_update');
        return this.cleanFields;
      }
      throw new Error(`ERROR Updating: ${res.first_error}`);
    });
};

const _add = function _add(saveFields) {
  const toSave = { ...saveFields, createdAt: new Date().getTime() };

  return this.db
    .table(this.tableName)
    .insert(toSave)
    .run(this.conn)
    .then((res) => {
      if (res.errors === 0) {
        const { generated_keys: [id] } = res;
        this.fields = { ...this.fields, ...toSave };
        this.fields.id = id;
        debug({ color: 'bold' }, `Successfully inserted ${res.inserted} record into model %${this.modelName}%`);
        info({ fields: this.cleanFields });
        if (this.warnings.length > 0) {
          warn('Warnings', this.warnings);
        }
        sdc.increment('api_db_add');
        return this.cleanFields;
      }
      throw new Error(`ERROR Adding Record: ${res.first_error}`);
    });
};

const Save = function Save(newFields) {
  // performs validation
  this.cleanFields = newFields;
  this.rawFields = { ...this.rawFields, ...newFields };
  if (this.errors.length > 0) {
    return Promise.resolve({ errors: this.errors });
  }
  return _testUnique.call(this)
    .then((uniqueRes) => {
      if (uniqueRes.id !== undefined) {
        this.fields.id = uniqueRes.id;
      }
      if (typeof uniqueRes === 'object' && (JSON.stringify(uniqueRes) === JSON.stringify(this.cleanFields))) {
        // if unique result already exists with matching fields, no need to save
        this.cleanFields = uniqueRes;
        return this.cleanFields;
      }
      return _processFieldsToSave.call(this)
        .then(({ fields }) => {
          if (has(fields, 'id')) {
            return _update.call(this, fields);
          }
          return _add.call(this, fields);
        });
    });
};

module.exports = Save;

const _ = require('lodash');
const StatsD = require('node-statsd');

const sdc = new StatsD();

const logQuery = function logQuery(name, queryParams, data) {
  sdc.increment('api_db_query');
  const table = queryParams.tableName || '';
  const params = _.without(queryParams, 'tableName');
  this.logger.debug(
    { _dbOp: { operation: 'query', params, table, data, name } },
    `${table} : "${name}" query: ${[].concat(data).length} results`
  );
  return data;
};

const findById = function findById(id) {
  if (typeof id !== 'string' || id === '') {
    this.logger.warn({ ID: id }, `findById query expects a string, received ${typeof ids}`);
    return false;
  }
  return this.db
    .table(this.tableName)
    .get(id)
    .run(this.conn);
};

const findByIds = function findByIds(ids) {
  // TODO: use as a utility validation wrapper
  let valError = false;
  if (!Array.isArray(ids)) {
    this.logger.warn({ IDs: ids }, `findByIds query expects an array, received ${typeof ids}`);
    valError = true;
  }

  ids.forEach(id => {
    if (typeof id !== 'string') {
      this.logger.warn({ IDs: ids }, `findByIds query expects an array of strings, received ${typeof id}`);
      valError = true;
    }
  });

  if (valError) {
    return false;
  }

  return this.db
    .table(this.tableName)
    .getAll(this.args(ids))
    .coerceTo('array')
    .run(this.conn)
    .then(logQuery.bind(this, 'findByIds', { ids, tableName: this.tableName }));
};

const modelById = function modelById(id) {
  return this.findById(id)
    .then(data => (data ? new this(data) : data));
};

const allByField = function allByField(fKey, fVals, tableName = this.tableName) {
  return this.db
    .table(tableName || this.tableName)
    .filter(record => fVals.indexOf(record(fKey)))
    .coerceTo('array')
    .run(this.conn)
    .then(logQuery.bind(this, 'allByField', { tableName, fVals, fKey }));
};

const findByField = function findByField(field, tableName = this.tableName) {
  const name = tableName || this.tableName;
  return this.db
    .table(name)
    .filter(field)
    .coerceTo('array')
    .run(this.conn)
    .then(logQuery.bind(this, 'findByField', { tableName, field }));
};

const modelByField = function modelByField(field) {
  return this.findByField(field)
    .then(data => (
      data && data.length > 0 ? new this(data[0]) : data
    ));
};

const all = function all(tableName = this.tableName) {
  return this.db
    .table(this.tableName)
    .orderBy('id')
    .coerceTo('array')
    .run(this.conn)
    .then(logQuery.bind(this, 'all', { tableName }));
};

const allDeep = function allDeep() {
  return this.all()
    .then(records => {
      const recordIds = _.map(records, 'id');
      const lookups = [];
      _.keys(this.foreignKeys).forEach(key => {
        const { relation: { table, field = 'id' } } = this.foreignKeys[key];
        const query = this.allByField(field, recordIds, table);
        lookups.push(Promise.all([query, { key, field }]));
      });
      lookups.unshift(records);
      return Promise.all(lookups);
    })
    .then(results => {
      let records = results[0];
      for (let i = 1; i < results.length; i += 1) {
        const fieldItems = results[i][0];
        const { key, field } = results[i][1];
        records = records.map(record => {
          // record[key] = fieldItems.filter(fi => fi[field] === record.id);
          const recordFields = fieldItems.filter(fi => fi[field] === record.id);
          return { ...record, [key]: recordFields };
        });
      }
      return records;
    });
};

module.exports = {
  findById,
  findByIds,
  modelByField,
  findByField,
  allByField,
  modelById,
  all,
  allDeep
};

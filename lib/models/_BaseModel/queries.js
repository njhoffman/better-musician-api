const StatsD = require('node-statsd');
const { warn, debug, trace } = require('lib/utils/logger')('api:_BaseModel:queries');

const sdc = new StatsD();

const logQuery = function logQuery(name, data, params) {
  sdc.increment('api_db_query');
  const table = params.tableName || '';
  debug({ ...params }, `${table} : ${name} query: ${[].concat(data).length} results`);
  trace({ params, data }, `${table} : ${name} query`);
  return data;
};

const findById = function findById(id) {
  if (typeof id !== 'string' || id === '') {
    warn({ ID: id }, `findById query expects a string, received ${typeof ids}`);
    return false;
  }
  return this.db
    .table(this.tableName)
    .get(id)
    .run(this.conn)
    .then((data) => logQuery(
      'findById', data, { ID: id, tableName: this.tableName }
    ));
};

const findByIds = function findByIds(ids) {
  // TODO: use as a utility validation wrapper
  let valError = false;
  if (!Array.isArray(ids)) {
    warn({ IDs: ids }, `findByIds query expects an array, received ${typeof ids}`);
    valError = true;
  }
  ids.forEach(id => {
    if (typeof id !== 'string') {
      warn({ IDs: ids }, `findByIds query expects an array of strings, received ${typeof id}`);
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
    .then((data) => logQuery(
      'findByIds', data, { ids, tableName: this.tableName }
    ));
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
    .then((data) => logQuery(
      'allByField', data, { fKey, fVals, tableName }
    ));
};

const findByField = function findByField(field, tableName = this.tableName) {
  const name = tableName || this.tableName;
  return this.db
    .table(name)
    .filter(field)
    .coerceTo('array')
    .run(this.conn)
    .then((data) => logQuery(
      'findByField', data, { field, tableName }
    ));
};

const modelByField = function modelByField(field) {
  return this.findByField(field)
    .then(data => (
      data && data.length > 0 ? new this(data[0]) : data
    ));
};

module.exports = {
  findById,
  findByIds,
  modelByField,
  findByField,
  allByField,
  modelById
};

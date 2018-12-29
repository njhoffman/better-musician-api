const _ = require('lodash');
const StatsD = require('node-statsd');

const Promise = require('bluebird');

const sdc = new StatsD();

const logQuery = function logQuery(name, queryParams, data) {
  sdc.increment('api_db_query');
  const table = queryParams.tableName || '';
  const params = _.without(queryParams, 'tableName');
  this.logger.debug({
    _dbOp: {
      operation: 'query',
      params,
      table,
      resultCount: data ? data.length : 0,
      data,
      name
    }
  }, `${table} : "${name}" query: ${[].concat(data).length} results`);

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
    .run(this.conn)
    .then(logQuery.bind(this, 'findById', { tableName: this.tableName, id }));
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
    .then(data => (data ? new this(data, true) : data));
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
      data && data.length > 0
        ? new this(data[0], true) : data
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

const allByField = function allByField(fKey, fVals, tableName = this.tableName) {
  return this.db
    .table(tableName || this.tableName)
    .filter(record => fVals.indexOf(record(fKey)))
    .coerceTo('array')
    .run(this.conn)
    .then(logQuery.bind(this, 'allByField', { tableName, fVals, fKey }));
};


const allDeep = function allDeep() {
  const self = this;
  return this.all()
    .then(records => {
      const lookups = [];
      _.keys(self.foreignKeys).forEach(foreignKey => {
        const { relation: { Model, reverse, field: fieldIdName = 'id' } } = self.foreignKeys[foreignKey];
        const recordIds = _.uniq(_.map(records, foreignKey));
        const query = Model.allByField(fieldIdName, recordIds);
        lookups.push(Promise.all([query, { foreignKey, fieldIdName, reverse }]));
      });
      lookups.unshift(records);
      return Promise.all(lookups);
    })
    .then(results => {
      let records = results[0];
      for (let i = 1; i < results.length; i += 1) {
        const fieldItems = results[i][0];
        const { foreignKey, reverse, fieldIdName } = results[i][1];
        records = records.map(record => {
          let fKeyValues;
          if (reverse) {
            fKeyValues = fieldItems.filter(fieldItem =>
              fieldItem[fieldIdName] === record.id);
          } else {
            fKeyValues = fieldItems.filter(
              fieldItem => fieldItem[fieldIdName] === record[foreignKey]
            );
          }
          // if (foreignKey === 'userFields') debugger;
          return {
            ...record,
            [foreignKey]: fKeyValues.length === 1 ? fKeyValues[0] : fKeyValues
          };
        });
      }
      return records;
    });
};

const queries = {
  findById,
  findByIds,
  modelByField,
  findByField,
  allByField,
  modelById,
  all,
  allDeep
};


module.exports = queries;

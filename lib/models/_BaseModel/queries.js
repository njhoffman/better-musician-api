const StatsD = require('node-statsd');
const sdc = new StatsD();

const findById = function(id) {
  sdc.increment('api_db_query');
  return this.db
    .table(this.tableName)
    .get(id)
    .run(this.conn);
}

const findByIds = function(ids) {
  sdc.increment('api_db_query');
  return this.db
    .table(this.tableName)
    .getAll(this.args(ids))
    .coerceTo('array')
    .run(this.conn);
}

const modelById = function(id) {
  return this.findById(id)
    .then(data => {
      return data ? new this(data) : data;
    });
}


const allByField = function(fKey, fVals, tableName = false) {
  sdc.increment('api_db_query');
  return this.db
    .table(tableName || this.tableName)
    .filter(record => {
      return fVals.indexOf(record(fKey));
    })
    .coerceTo('array')
    .run(this.conn);
}

const findByField = function(field, tableName = false) {
  sdc.increment('api_db_query');
  return this.db
    .table(tableName || this.tableName)
    .filter(field)
    .coerceTo('array')
    .run(this.conn).then(res => {
      return  res.length === 0 ? false
        : res.length === 1 ? res[0]
        : res;
    });
}

const modelByField = function(field) {
  return this.findByField(field)
    .then(data => {
      return data ? new this(data) : data;
    });
}

module.exports = exports = {
  findById,
  findByIds,
  modelByField,
  findByField,
  allByField,
  modelById
};

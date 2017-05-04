const r = require('rethinkdb');
const { log } = require('debugger-256')('api:db');

const config = require('../../config/project.config');
const dbName = config.db_name;

let db, conn;

exports.init = () => {
  let existingTables;
  log('trying to connect to: ' + config.db_host + ':' + config.db_port);
  return r.connect({ host: config.db_host, port: config.db_port })
    .then(_conn => {
      log('connected');
      conn = _conn;
      return r.dbList().run(conn);
    }).then(databases => {
      log('existing databases', databases);
      if (databases.indexOf(dbName) === -1) {
        log(`${dbName} does not exist, creating...`);
        // dbCreate(dbName);
        return r.dbCreate(dbName).run(conn);
      }
    }).then(() => {
      db = r.db(dbName);
      return db.tableList().run(conn);
    }).then(tables => {
      existingTables = tables;
      log('existing tables: ', existingTables);
      return exports.createTable('users', existingTables);
    }).then(() => exports.createTable('songs', existingTables))
    .then(() => exports.createTable('artists', existingTables))
    .then(() => exports.createTable('fields', existingTables))
    .then(() => exports.createTable('instruments', existingTables))
    .then(() => exports.createTable('genres', existingTables))
    .then(() => exports.createTable('levels', existingTables))
    .then(() => {
      let tableMap = {};
      existingTables.forEach(tableName => {
        tableMap[tableName] = r.db(dbName).table(tableName);
      });
      return {
        r: r,
        conn: conn,
        db: db,
        tables: tableMap
      };
    });
};

exports.getDbModule = () => {
  return { conn, db, r };
};

exports.getTables = () => {
  return db
    .tableList()
    .run(conn);
};

exports.createTable = function (tableName, existingTables) {
  if (existingTables.indexOf(tableName) === -1) {
    return db.tableCreate(tableName).run(conn)
      .then(() => log('created ' + tableName + ' table'));
  } else {
    return exports.dumpTable(tableName)
      .then(/* data  => debug(tableName + " table already created %O", data) */);
  }
};

exports.resetTable = function resetTable (name, exampleData = {}) {
  return r.db(dbName)
    .table(name)
    .delete()
    .insert(exampleData);
};

exports.dumpTable = function dumpTable (name) {
  return r.db(dbName)
    .table(name)
    .orderBy('id')
    .coerceTo('array')
    .run(conn);
};

// rethinkdb design pattern example
function counter (rethinkState, action) {
  const table = rethinkState.tables['songs'];
  if (!action) {
    log('setting the default state');
    return table.insert({
      id: 1,
      points: 0
    }).run(rethinkState.conn)
      .then(() => rethinkState);
  }

  switch (action.type) {
    case 'INCREMENT':
      log('incrementing value');
      return table
        .get(1)
        .update({
          points: rethinkState.r.row('points').add(1)
        })
        .run(rethinkState.conn)
        .then(() => rethinkState);
    case 'DECREMENT':
      log('decrementing');
      return table
        .get(1)
        .update({
          points: rethinkState.r.row('points').add(-1)
        })
        .run(rethinkState.conn)
        .then(() => rethinkState);
    default:
      return rethinkState;
  }
}

exports.example = function () {
  exports.init()
    .then(function subscribe (state) {
      const table = state.tables['songs'];
      return table
        .get(1)
        .changes()
        .run(state.conn)
        .then(cursor => {
          cursor.each((err, change) => log(change.new_val.points));
        })
        .then(() => state);
    })
    .then(counter)
    .then(rethinkState => counter(rethinkState, { type: 'INCREMENT' }))
    .then(rethinkState => counter(rethinkState, { type: 'INCREMENT' }))
    .then(rethinkState => counter(rethinkState, { type: 'INCREMENT' }))
    .then(rethinkState => counter(rethinkState, { type: 'INCREMENT' }))
    .then(rethinkState => counter(rethinkState, { type: 'DECREMENT' }))
    .done();
};

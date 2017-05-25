const r = require('rethinkdb');
const { log, trace } = require('debugger-256')('api:db');

const config = require('../../config/project.config');
const dbName = config.db_name;

let db, conn;

const connect = (config) => {
  log(`Trying to connect to RethinkDB: %${config.db_host}: ${config.db_port}%`, { color: 'cyan' });
  return r.connect({ host: config.db_host, port: config.db_port })
    .then(_conn => {
      log(`Connected to ${_conn.host} on Port: ${_conn.port}`);
      return (conn = _conn);
  });
};

const getDatabases = () => {
  return r.dbList().run(conn)
    .then(databases => {
      log('Existing Databases:', databases);
      return databases;
    });
};

const createDatabase = (databases) => {
  if (databases.indexOf(dbName) === -1) {
    log(`${dbName} does not exist, creating...`);
    return r.dbCreate(dbName).run(conn).then(assignDatabase);
  }
  return assignDatabase();
};

const assignDatabase = () => (db = r.db(dbName));

exports.init = () => {
  let existingTables;
  return connect(config)
    .then(getDatabases)
    .then(createDatabase)
    .then(assignDatabase)
    .then(() => {
      return db.tableList().run(conn);
    }).then(tables => {
      existingTables = tables;
      log('Existing Tables:', existingTables);
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

exports.getDbModule = function() { return  { conn, db, r } };
exports.getTables = () => db.tableList().run(conn);

exports.createTable = (tableName, existingTables) => {
  if (existingTables.indexOf(tableName) === -1) {
    return db.tableCreate(tableName).run(conn)
      .then(() => log(`Created ${tableName} table`));
  } else {
    return exports.dumpTable(tableName)
      .then(data  => trace(`${tableName} table already created`, data) );
  }
};

exports.resetTable = (name, initialData = {}) => {
  return r.db(dbName)
    .table(name)
    .delete()
    .insert(initialData);
};

exports.dumpTable = (name) => {
  return r.db(dbName)
    .table(name)
    .orderBy('id')
    .coerceTo('array')
    .run(conn);
};


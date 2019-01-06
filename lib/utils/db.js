const r = require('rethinkdb');

const getModels = require('../models');
const { info, trace } = require('./logger')('db');

let db;
let conn;
let config;

const connect = () => {
  const { dbHost, dbPort } = config;
  return r.connect({ host: dbHost, port: dbPort })
    .then(_conn => {
      info(`Connected to port ${_conn.port}`);
      conn = _conn;
    });
};

const getDatabases = () => {
  const { dbName } = config;
  return r.dbList().run(conn)
    .then(databases => {
      info({ databases }, `${databases.length} existing databases`);
      info({ color: 'bold' }, `Attempting to connect to: %${dbName}%`);
      return databases;
    });
};

const createDatabase = (databases) => {
  const { dbName } = config;
  if (databases.indexOf(dbName) === -1) {
    info(`${config.dbName} does not exist, creating...`);
    return r.dbCreate(dbName).run(conn);
  }
  return Promise.resolve();
};

const assignDatabase = () => {
  const { dbName } = config;
  db = r.db(dbName);
};

const buildTables = ([tables, models]) => {
  const toBuild = [];
  Object.keys(models).forEach(name => {
    const model = models[name];
    if (tables.indexOf(model.tableName) === -1) {
      // TODO: probably be better part of baseModel?
      toBuild.push(
        model.createTable()
          .then(model.seed.bind(model))
      );
    }
  });
  return Promise.all(toBuild).then(() => models);
};

const dumpModels = (models) => {
  const toDump = [];
  Object.keys(models).forEach(name => {
    toDump.push(
      models[name].all()
        .then(data => (
          trace({ data }, `Dumping ${name}:`)
        ))
    );

    toDump.push(
      models[name].count
        .then(count => info({ color: 'bold' }, `Model: %${name}% (${count} records)`))
    );
  });
  return Promise.all(toDump).then(() => models);
};

exports.dumpTable = (name) => {
  const { dbName } = config;
  return r.db(dbName)
    .table(name)
    .orderBy('id')
    .coerceTo('array')
    .run(conn);
};

exports.initDb = (_config) => {
  config = _config;
  const { dbHost, dbPort } = config;
  info({ color: 'bold', }, `Trying to connect to RethinkDB: %${dbHost}:${dbPort}%`);
  return connect(config)
    .then(getDatabases)
    .then(createDatabase)
    .then(assignDatabase)
    .then(() => Promise.all([
      exports.getTables(),
      getModels()
    ]))
    .then(buildTables)
    .then(false || dumpModels);
};

exports.getDbModule = () => ({ conn, db, r });

exports.getTables = () => db.tableList().run(conn);

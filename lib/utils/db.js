const r = require('rethinkdb');
const { filter } = require('lodash');

const { log, info, trace, error } = require('debugger-256')('api:db');

const getModels = require('../models');

let db, conn, config;

const connect = () =>
  r.connect({ host: config.db_host, port: config.db_port })
    .then(_conn => {
      log(`Connected to port ${_conn.port}`);
      return (conn = _conn);
  });

const getDatabases = () =>
  r.dbList().run(conn)
    .then(databases => {
      info('Existing databases', databases);
      info(`Attempgint to connect to: %${config.db_name}%`, { color: 'cyan' });
      return databases;
    });

const createDatabase = (databases) => {
  if (databases.indexOf(config.db_name) === -1) {
    log(`${config.db_name} does not exist, creating...`);
    return r.dbCreate(config.db_name).run(conn);
  }
};

const assignDatabase = () => (db = r.db(config.db_name));

const buildTables = ([tables, models]) => {
  let toBuild = [];
  Object.keys(models).map(name => {
    const model = models[name];
    if (tables.indexOf(model.tableName) === -1) {
      toBuild.push(
        // TODO: probably be better part of baseModel?
        model.createTable()
        .then(model.seed.bind(model))
      );
    }
  });
  return Promise.all(toBuild).then(() => models);
};

const dumpModels = (models) => {
  let toDump = [];
  Object.keys(models).forEach(name => {
    // TODO: fix debugger-256 to prevent 'data' from being popped off
    // toDump.push(models[name].all.then(data => trace(`Dumping %${name}%:`, { color: 'lightCyan' },  data)));
    toDump.push(models[name].all.then(data => trace(`Dumping %${name}%:`, data)));
    toDump.push(models[name].count.then(count => info(`Model: %${name}% (${count} records)`, { color: 'lightCyan'}, { filterMax: 5 })));
  });
  return Promise.all(toDump).then(() => models);
};

exports.dumpTable = (name) => {
  return r.db(config.db_name)
    .table(name)
    .orderBy('id')
    .coerceTo('array')
    .run(conn);
};

exports.initDb = (_config) => {
  config = _config;
  log(`Trying to connect to RethinkDB: %${config.db_host}:${config.db_port}%`, { color: 'cyan' });
  return connect(config)
    .then(getDatabases)
    .then(createDatabase)
    .then(assignDatabase)
    .then(() => Promise.all([
      exports.getTables(),
      getModels()
    ]))
    .then(buildTables)
    .then(dumpModels);
};

exports.getDbModule = function() { return  { conn, db, r } };
exports.getTables = () => db.tableList().run(conn);

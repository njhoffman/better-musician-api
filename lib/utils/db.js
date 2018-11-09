const r = require('rethinkdb');

const getModels = require('lib/models');
const { info, trace } = require('./logger')('db');

let db;
let conn;
let config;

const connect = () => (
  r.connect({ host: config.db_host, port: config.db_port })
    .then(_conn => {
      info(`Connected to port ${_conn.port}`);
      conn = _conn;
    })
);

const getDatabases = () =>
  r.dbList().run(conn)
    .then(databases => {
      info('Existing databases', databases);
      info({ color: 'bold' }, `Attempgint to connect to: %${config.db_name}%`);
      return databases;
    });

const createDatabase = (databases) => {
  if (databases.indexOf(config.db_name) === -1) {
    info(`${config.db_name} does not exist, creating...`);
    return r.dbCreate(config.db_name).run(conn);
  }
  return Promise.resolve();
};

const assignDatabase = () => {
  db = r.db(config.db_name);
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
    // TODO: fix debugger-256 to prevent 'data' from being popped off
    // toDump.push(models[name].all.then(data => trace(`Dumping %${name}%:`, { color: 'lightCyan' },  data)));
    toDump.push(
      models[name].all()
        .then(data => trace({ data }, `Dumping ${name}:`))
    );

    toDump.push(
      models[name].count
        .then(count => info({ color: 'bold' }, `Model: %${name}% (${count} records)`))
    );
  });
  return Promise.all(toDump).then(() => models);
};

exports.dumpTable = (name) => (
  r.db(config.db_name)
    .table(name)
    .orderBy('id')
    .coerceTo('array')
    .run(conn)
);

exports.initDb = (_config) => {
  config = _config;
  info({ color: 'bold', }, `Trying to connect to RethinkDB: %${config.db_host}:${config.db_port}%`);
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

exports.getDbModule = () => ({ conn, db, r });

exports.getTables = () => db.tableList().run(conn);

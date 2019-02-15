#!/usr/bin/env node
/* eslint-disable import/no-dynamic-require, global-require */
// TODO: convert to event emitter pattern

const appRoot = require('app-root-path');
const r = require('rethinkdb');
const { argv } = require('yargs');
const chalk = require('chalk');

// babel registration (runtime transpilation for node)
require(`${appRoot}/config/babel`);

const { getConfig } = require(`${appRoot}/config`);
const models = require(`${appRoot}/lib/models/all`)();
const monitorUtils = require('./monitor.utils');

const allTables = Object.keys(models).map(key => models[key].tableName);

const parseOptions = () => {
  // TODO: help command - print options
  const { dbHost, dbPort, dbName, appName } = getConfig();
  const options = {
    monitoredTables: argv.tables || process.env.DB_MONITOR_TABLES || allTables,
    dbHost: argv.dbhost || process.env.DB_HOST || dbHost,
    dbPort: argv.dbport || process.env.DB_PORT || dbPort,
    dbName: argv.db || process.env.DB_NAME || dbName,
    appName,
    indexSpacing: 10,
    cols: argv.colwidth || process.env.TERM_COLWIDTH || 186,
    oneLine: argv.oneline || process.env.DB_MONITOR_ONELINE || false
  };
  return options;
};

let n = 0;
const monitorTable = (tableName, connection, options) => {
  const { outputLine, formatLine, clr } = monitorUtils(options);
  console.log(`\n ...monitoring table ${clr.bold}${tableName}${clr.reset}\n`);
  r.db(options.dbName)
    .table(tableName)
    .changes({ includeInitial: true })
    .run(connection, (err, cursor) => {
      if (err) {
        console.error(err);
      }

      // cursor.each(console.log);
      cursor.each((cursorErr, row) => {
        if (cursorErr) {
          console.error(cursorErr);
        }
        const { old_val: oldVal, new_val: newVal } = row;
        const line = formatLine(tableName, oldVal, newVal);
        process.stdout.write(
          outputLine(line, n)
        );
        n += 1;
      });
    });
};

const options = parseOptions();

console.log(chalk.bold(`\n-- ${options.appName} database monitor --\n`));

r.connect({
  host: options.dbHost,
  port: options.dbPort
}, (err, conn) => {
  if (err) throw err;

  console.log([
    `Connected to port: ${chalk.bold(options.dbPort)}`,
    `Watching database: ${chalk.cyan(options.dbName)}`,
    `Tables to monitor: ${options.monitoredTables}`,
    `  One Line: ${options.oneLine}, Columns: ${options.cols}`
  ].join('\n'));

  const monitored = options.monitoredTables
    .map(tableName => monitorTable(tableName, conn, options));
  Promise.all(monitored).catch(console.error);
});

/* eslint-enable import/no-dynamic require, global-require */

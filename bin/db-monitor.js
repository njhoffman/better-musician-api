#!/usr/bin/env node

/* eslint-disable import/no-dynamic-require, global-require */

// TODO: convert to event emitter pattern
const r = require('rethinkdb');
const appRoot = require('app-root-path');
const { argv } = require('yargs');
const chalk = require('chalk');

const models = require(`${appRoot}/lib/models/all`)();
const allTables = Object.keys(models).map(key => models[key].tableName);
const monitorUtils = require('./db-monitor.utils');

const parseOptions = () => {
  // TODO: help command - print options
  const options = {
    monitoredTables: argv.tables || process.env.DB_MONITOR_TABLES || allTables,
    dbHost: argv.dbhost || process.env.DB_HOST || 'localhost',
    dbPort: argv.dbport || process.env.DB_PORT || 28015,
    dbName: argv.db || process.env.DB_NAME || 'better_musician_dev',
    indexSpacing: 10,
    cols: argv.colwidth || process.env.TERM_COLWIDTH || 186,
    oneLine: argv.oneline || process.env.DB_MONITOR_ONELINE || false
  };
  return options;
};

let n = 0;
const monitorTable = (tableName, connection, options) => {
  const { outputLine, formatLine, clr } = monitorUtils(options);
  console.log(` ...monitoring table ${clr.bold}${tableName}${clr.reset}`);
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

console.log(chalk.bold('\n-- BetterMusician-api database monitor --\n'));

r.connect({
  host: options.dbHost,
  port: options.dbPort
}, (err, conn) => {
  if (err) throw err;

  console.log(
    `Connected to port: ${chalk.bold(options.dbPort)}, watching db: ${chalk.cyan(options.dbName)}`
  );

  const monitored = options.monitoredTables
    .map(tableName => monitorTable(tableName, conn, options));
  Promise.all(monitored).catch(console.error);
});

/* eslint-enable import/no-dynamic require, global-require */

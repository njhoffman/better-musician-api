#!/usr/bin/env node

// TODO: convert to event emitter pattern
const r = require('rethinkdb');
const util = require('util');

const monitoredTables = [
  'users', 'fields', 'songs',
  'artists', 'genres', 'instruments'
];


const dbName = 'better_musician_test';
const indexSpacing = 15;
const cols = process.env.TERM_COLWIDTH || 180;
const oneLine = true;

// echo '\e[38;2;255;50;180m\e[48;2;130;180;255mHello TruColors'
// echo -ne '\e[1;10;255m BOLD GREEN' #
const clr = {
  bold:    '\x1b[38;5;255m',
  gray:    '\x1b[38;5;243m',
  insert:  '\x1b[38;5;30m',
  update:  '\x1b[38;5;57m',
  delete:  '\x1b[38;5;124m',
  reset:   '\x1b[0m',
  id:      '\x1b[38;5;248m',
  name:    '\x1b[38;5;068m',
  index:   '\x1b[38;5;060m'
};

let connection = null;
let n = 0;

/* eslint-disable no-control-regex */
const ansiRE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
/* eslint-enable no-control-regex */

const lineLength = (str) => str.trim().replace(ansiRE, '').length;

const trimLine = (line) => {
  if (oneLine) {
    return lineLength(line) > cols
      ? line.slice(0, (cols - lineLength(line))).trim()
      : line.trim();
  }
  return line;
};

const outputLine = (line, idx) => {
  const indexPad = oneLine
    ? Array(cols - lineLength(line) - idx.toString().length + indexSpacing).join(' ')
    : '   ';

  return `${line}${clr.index}${indexPad}${idx}${clr.reset}\n`;
};

const monitorTable = (tableName) => (
  r.db(dbName)
    .table(tableName)
    .changes({ includeInitial: true })
    .run(connection, (err, cursor) => {
      if (err) {
        console.error(err);
      }
      // cursor.each(console.log);
      // 196 width
      const formatObj = (obj) => util.inspect(obj, {
        colors: false, breakLength: Infinity
      });

      const namePad = Array(3 - tableName.length + (
        monitoredTables
          .reduce((acc, table) => (acc > table.length ? acc : table.length), 0)
      )).join(' ');

      cursor.each((cursorErr, row) => {
        if (cursorErr) {
          console.error(cursorErr);
        }
        const out = [];
        const { old_val: oldVal, new_val: newVal } = row;
        if (!oldVal) {
          out.push(`${clr.insert} INSERT   ${clr.name}${tableName.toUpperCase()}${clr.id}${namePad}${newVal.id}`);
          out.push(` ${clr.gray} ${formatObj(newVal)}`);
        } else if (!newVal) {
          out.push(`${clr.delete} DELETE   ${clr.name}${tableName.toUpperCase()}${clr.id}${namePad}${oldVal.id}`);
          out.push(` ${clr.gray} ${formatObj(oldVal)}`);
        } else {
          out.push(`${clr.update} UPDATE   ${clr.name}${tableName.toUpperCase()}${clr.id}${namePad}${newVal.id}`);
          out.push(` ${clr.gray} ${formatObj(oldVal)} ${formatObj(newVal)}`);
        }
        process.stdout.write(
          // out.join(' ').slice(0, 180) + '\n'
          outputLine(trimLine(out.join(' ')), n)
        );
        n += 1;
      });
      console.log(` ...monitoring table ${clr.bold}${tableName}${clr.reset}`);
    })
);

r.connect({ host: 'localhost', port: 28015 }, (err, conn) => {
  if (err) throw err;
  connection = conn;

  // TODO: doesnt work, anyway to get parent colwidth from calling shell?
  // const tput = spawn('tput', ['cols']);
  // tput.stdout.on('data', data => {
  //   cols = data;
  // });
  // tput.stderr.on('data', errData => console.error(errData));

  const monitored = monitoredTables.map(tableName => monitorTable(tableName));
  Promise.all(monitored).catch(console.error);
});

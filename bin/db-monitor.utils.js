const util = require('util');

/* eslint-disable no-control-regex */
const ansiRE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
/* eslint-enable no-control-regex */

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

module.exports = (options) => {
  const { oneLine, cols, indexSpacing, monitoredTables } = options;

  const lineLength = (str) => str.trim().replace(ansiRE, '').length;

  const formatObj = (obj) => util.inspect(obj, {
    colors: false, breakLength: Infinity
  });

  const namePad = (tableName) => Array(3 - tableName.length + (
    monitoredTables.reduce((acc, table) =>
      (acc > table.length ? acc : table.length), 0)
  )).join(' ');


  const trimLine = (line) => {
    if (oneLine) {
      return lineLength(line) > cols
        ? line.slice(0, (cols - lineLength(line))).trim()
        : line.trim();
    }
    return line;
  };

  const outputLine = (line, idx) => {
    const trimmed = trimLine(line);
    const indexPad = oneLine
      ? Array(cols - lineLength(trimmed) - idx.toString().length + indexSpacing).join(' ')
      : '   ';
    return `${trimmed}${clr.index}${indexPad}${idx}${clr.reset}\n`;
  };

  const formatLine = (tableName, oldVal, newVal) => {
    const fmtTable = `${clr.name}${tableName.toUpperCase()}${clr.id}${namePad(tableName)}`;
    if (!oldVal) {
      return `${clr.insert} INSERT   ${fmtTable} ${newVal.id} ${clr.gray} ${formatObj(newVal)}`;
    } else if (!newVal) {
      return `${clr.delete} DELETE   ${fmtTable} ${oldVal.id} ${clr.gray} ${formatObj(oldVal)}`;
    }
    return `${clr.update} UPDATE   ${fmtTable} ${newVal.id} ${clr.gray} ${formatObj(oldVal)} ${formatObj(newVal)}`;
  };

  return { outputLine, formatLine, clr };
};

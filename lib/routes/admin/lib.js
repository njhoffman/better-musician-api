const Promise = require('bluebird');
const prettyHtml = require('json-pretty-html').default;
const { dumpTable, resetTable } = require('../../utils/db');

const { debug } = require('../../utils/logger')('api:routes:admin');

const outputTableText = (name, records) => {
  let output = `\n${name}`;
  records.forEach((record) => {
    output += `\n   ${record.id}`;
    Object.keys(record).forEach((field) => {
      if (field !== 'id') {
        output += `\n      ${field} => ${record[field]}`;
      }
    });
  });
  return output;
};

const outputTableHtml = (name, records) => {
  let output = `<br /><h3>${name}</h3>`;
  records.forEach(function (record) {
    output += `<pre>${JSON.stringify(record)}</pre>`;
  });
  return output;
};

const outputTable = (name, context) => {
  return dumpTable(name)
    .then(records => {
      if (context === 'html') {
        return [
          `<div class="col">`,
          `<h2>${name}</h2>`
        ].join('\n') + prettyHtml(records) + '</div>';
      } else if (context === 'text') {
        return outputTableText(name, records);
      }
      return records;
    });
};

const outputModel = (name, context, models, deep) => {
  return (deep ? models[name].allDeep : models[name].all)
    .then(records => {
      // if (context === 'html') return outputTableHtml(name, records);
      if (context === 'html') {
        return [
          `<div class="col">`,
          `<h2>${name}</h2>`,
        ].join('\n') + prettyHtml(records) + '</div>';
      } else if (context === 'text') {
        return outputTableText(name, records);
      }
      return records;
    });
};

const outputLine = (line, context) => {
  if (context === 'html') {
    return  line.replace('\n', '<br />');
  } else if (context === 'text') {
    return line;
  }
  return '';
};

const outputCount = (name, models) => {
  return models[name].getCount()
    .then(count => {
      return `\n${name}\t${count}`;
    });
};

const resetModel = (name, context, models) => {
  return models[name].reset()
    .then((results) => {
      if (results.errors === 0) {
        return outputLine(`\nReset model ${name} with ${results.inserted} records`, context);
      } else {
        throw Error(`Error resetting model ${name}`);
      }
    });
};

const emptyModel = (name, context, models) => {
  // TODO: setup custom error handling
  if (!models[name]) {
    return Promise.resolve(`\nModel ${name} does not exist`);
  }
  return models[name].empty()
    .then((results) => {
      if (results.errors === 0) {
        return outputLine(`\nEmptied model ${name}`, context);
      } else {
        throw Error(`Error emptying model ${name}`);
      }
    });
};

module.exports = {
  emptyModel,
  resetModel,
  outputCount,
  outputModel,
  outputTable
};

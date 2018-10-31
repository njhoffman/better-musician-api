const Promise = require('bluebird');
const prettyHtml = require('json-pretty-html').default;
const { dumpTable } = require('../../utils/db');

// const { debug } = require('../../utils/logger')('api:routes:admin');

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

const outputTable = (name, context) => (
  dumpTable(name)
    .then(records => {
      if (context === 'html') {
        return [
          '<div class="col">',
          `<h2>${name}</h2>`,
          prettyHtml(records),
          '</div>'
        ].join('\n');
      } else if (context === 'text') {
        return outputTableText(name, records);
      }
      return records;
    })
);

const outputModel = (name, context, models, deep) => (
  (deep ? models[name].allDeep : models[name].all)
    .then(records => {
      if (context === 'html') {
        return [
          '<div class="col">',
          `<div><h2>${name}</h2><em>${records.length}</em></div>`,
          prettyHtml(records),
          '</div>'
        ].join('\n');
      } else if (context === 'text') {
        return outputTableText(name, records);
      }
      return records;
    })
);

const outputLine = (line, context) => {
  if (context === 'html') {
    return line.replace('\n', '<br />');
  } else if (context === 'text') {
    return line;
  }
  return '';
};

const outputCount = (name, models) => (
  models[name].getCount().then(count => `\n${name}\t${count}`)
);

const resetModel = (name, context, models) => (
  models[name].reset()
    .then((results) => {
      if (results.errors === 0) {
        return outputLine(`\nReset model ${name} with ${results.inserted} records`, context);
      }
      throw Error(`Error resetting model ${name}`);
    })
);

const emptyModel = (name, context, models) => {
  // TODO: setup custom error handling
  if (!models[name]) {
    return Promise.resolve(`\nModel ${name} does not exist`);
  }
  return models[name].empty()
    .then((results) => {
      if (results.errors === 0) {
        return outputLine(`\nEmptied model ${name}`, context);
      }
      throw Error(`Error emptying model ${name}`);
    });
};

const seedModel = (name, context, models) => (
  models[name].seed()
    .then((results) => {
      if (results.errors === 0) {
        return outputLine(`\nSeed model ${name} with ${results.inserted} records`, context);
      }
      throw Error(`Error resetting model ${name}`);
    })
);


module.exports = {
  emptyModel,
  resetModel,
  seedModel,
  outputCount,
  outputModel,
  outputTable
};

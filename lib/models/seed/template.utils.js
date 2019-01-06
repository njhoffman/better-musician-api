const _ = require('lodash');
const faker = require('faker');

const fakerMap = {
  firstName: faker.name.firstName,
  lastName: faker.name.lastName,
  email: faker.internet.email,
  url: faker.internet.url,
  password: faker.internet.password,
  bool: faker.random.boolean,
  string: faker.lorem.words,
  uuid: faker.random.uuid,
  word: faker.random.word
};

const customMap = {
  number: ({ max = 0, min = 100 }) => parseInt(Math.random() * max, 10)
};

const loadField = (fieldDef, seedMeta = {}, key) => {
  // if (key === 'id') {
  //   _.merge(seedMeta, { seedType: 'uuid' });
  // }
  const { validate, default: defaultValue } = fieldDef;
  const { seedType } = seedMeta;

  const dataType = seedType || validate;

  if (_.isArray(seedMeta)) {
    return seedMeta[Math.floor(Math.random() * seedMeta.length)];
  } else if (_.isFunction(customMap[dataType])) {
    return customMap[dataType](seedMeta);
  } else if (_.isFunction(fakerMap[dataType])) {
    const fakeData = fakerMap[dataType]();
    return fakeData;
  } else if (defaultValue) {
    return defaultValue;
  }
  return null;
};

const filterFields = (tableKeys, seedMeta) => (
  _.keys(tableKeys)
    .filter(tKey => seedMeta[tKey] || tableKeys[tKey].required || tableKeys[tKey].default)
    .filter(tKey => !tableKeys[tKey].relation)
);

const loadFields = (tableKeys, seedMeta) => {
  const newFields = {};
  filterFields(tableKeys, seedMeta).forEach(tKey => {
    newFields[tKey] = loadField(tableKeys[tKey], seedMeta[tKey], tKey);
  });
  return newFields;
};

const cleanData = (data) => {
  const cleanedData = {};
  const stripKeys = ['refs', 'refId', 'ref'];
  _.keys(data).forEach(tableKey => {
    const cleanedTable =  _.map(data[tableKey], record => {
      _.keys(record)
        .filter(recordKey => _.isArray(record[recordKey]) && _.isObject(record[recordKey][0]))
        .forEach(recordKey => {
          /* eslint-disable no-param-reassign */
          record[recordKey] = _.map(record[recordKey], multiple => (
            _.omit(multiple, stripKeys)
          ));
          /* eslint-enable no-param-reassign */
        });
      return _.omit(record, stripKeys);
    });
    cleanedData[tableKey] = cleanedTable;
  });

  return cleanedData;
};


// 1 user: multiple instruments, genres, artists, fields, songs
const loadData = ({ model, records, relations, refs }, num = 0) => {
  const { tableKeys, seedMeta = {} } = model;

  // pre-defined ids (maybe not necessary, only use refIds?)
  const newRecords = records
    .filter(record => !_.isUndefined(record.id))
    .map(record => {
      const newFields = loadFields(tableKeys, seedMeta);
      return _.merge(newFields, relations, record);
    });

  // add refIds (load all if not defined)
  records
    .filter(record => _.isUndefined(record.id))
    .filter(record => [].concat(refs).indexOf(record.refId) !== -1 || !refs)
    .forEach(record => {
      const newFields = loadFields(tableKeys, { ...seedMeta, id: { seedType: 'uuid' } });
      newRecords.push(_.merge(newFields, relations, record));
    });

  // build additional related fields
  if (num > 0) {
    _.times(num, (i) => {
      const newFields = loadFields(tableKeys, { ...seedMeta, id: { seedType: 'uuid' } });
      _.merge(newFields, relations);
      newRecords.push(newFields);
    });
  }
  return newRecords;
};

module.exports = {
  loadData,
  cleanData
};

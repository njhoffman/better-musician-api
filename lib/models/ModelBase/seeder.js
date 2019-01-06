const { omit, isObject }  = require('lodash');
const { existsSync } = require('fs');
const { resolve: pathResolve } = require('path');

/* eslint-disable global-require, import/no-dynamic-require */
const getSeedData = function getSeedData(seedGroup = 'defaults') {
  const seedPath = pathResolve(`${__dirname}/../seedData/${seedGroup}/${this.tableName}.js`);
  this.logger.debug(`Attempting to load: ${seedPath}`);
  // must invalidate cache to prevent mutations from tests, need to use .default for dynamic require with babel7
  if (existsSync(seedPath)) {
    delete require.cache[require.resolve(seedPath)];
    return require(seedPath);
  }
  throw new Error(`Cannot find seed data for table ${this.tableName} in ${seedPath}`);
};
/* eslint-enable global-require, import/no-dynamic-require */

const seed = function seed(num = 0, seedInfo) {
  const seedData = isObject(seedInfo) ? seedInfo : this.getSeedData(seedInfo);
  const data = num > 0 ? seedData.slice(0, num) : seedData;

  const keyCount = 10; // keys(data).length;
  this.logger.info([
    `Seeding ${num > 0 ? num : ''}records for table: ${this.tableName}`,
    `model: ${this.modelName} (${keyCount} keys)`
  ].join(' '));

  return this.db
    .table(this.tableName)
    .insert(data, { returnChanges: true })
    .run(this.conn)
    .then(results => {
      const { errors, changes = [], inserted, first_error: firstError } = results;
      if (errors === 0) {
        this.logger.debug({
          _trace: { params: data, changed: changes },
          _dbOp: {
            data,
            operation: 'seed',
            table: this.tableName,
            resultCount: changes.length
          }
        }, `Seeded ${inserted} records for model ${this.modelName}`);

        return {
          ...omit(results, 'changes'),
          changed: this.changedFields(changes)
        };
      }
      throw new Error(`ERROR Seeding ${this.modelName}: ${firstError}`);
    });
};


module.exports = {
  getSeedData,
  seed,
};

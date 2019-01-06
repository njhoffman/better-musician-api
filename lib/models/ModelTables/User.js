const bcrypt = require('bcrypt');
const ModelBase = require('../ModelBase');
const getModels = require('../all');
// const { info } = require('../utils/logger')('api:model:user');

class User extends ModelBase {
  static get tableName() { return 'users'; }

  static get modelName() { return 'User'; }

  static get tableKeys() {
    const { Field, Song } = getModels();
    /* eslint-disable max-len */
    return {
      id:                   {},
      firstName:            {},
      lastName:             {},
      email:                { required: true, validate: ['email'] },
      password:             { validate: ['password'], hidden: true },
      picture:              { validate: ['url'] },
      maxDifficulty:        { validate: ['number'], default: 10 },
      maxProgress:          { validate: ['number'], default: 4 },
      // weeks until brush-up period starts, reminder email sent out
      songBrushUpInterval:  { validate: ['number'], default: 60 },
      // days until points are deducted
      songBrushUpDuration:  { validate: ['number'], default: 7 },
      songBrushUpEmail:     { validate: ['bool'], default: true },
      songGoalEmail:        { validate: ['bool'], default: true },
      visualTheme:          { default: 'steelBlue.dark' },
      normalizePoints:      { default: false },
      notificationsEmail:   { validate: ['email'] },
      userFields:           { relation: { type: 'oneToMany', reverse: true, field: 'user', table: 'fields', Model: Field } },
      songs:                { relation: { type: 'oneToMany', reverse: true, field: 'user', table: 'songs', Model: Song } },
      roles:                { default: 'user' }, // TODO: validate oneOf('default', 'user', 'admin') -> load from config
      updatedAt:            [], // TODO: validate timestamp
    };
    /* eslint-enable max-len */
  }

  static get seedMeta() {
    return {
      firstName: { seedType: 'firstName' },
      lastName: { seedType: 'lastName' },
      maxDifficulty: { min: 5, max: 20 },
      maxProgress: { min: 3, max: 10 },
      songBrushUpInterval: [1, 2, 4, 8, 26, 52],
      songBrushUpDuration: [7, 14, 30, 180, 365]
    };
  }

  static get modelData() {
    const { tableName, modelName, tableKeys } = User;
    return { tableName, modelName, tableKeys };
  }

  static generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  }

  constructor(userData, existing) {
    super(User.modelData, userData, existing);
  }

  validPassword(password) {
    if (global.__SKIP_AUTH__) {
      return true;
    }
    return password && this.fields.password ? bcrypt.compareSync(password, this.fields.password) : false;
  }
}

module.exports = User;

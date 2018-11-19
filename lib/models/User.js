const bcrypt = require('bcrypt');
const BaseModel = require('lib/models/_BaseModel');
const getModels = require('lib/models/all');
// const { info } = require('../utils/logger')('api:model:user');

class User extends BaseModel {
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
      songBrushUpInterval:  { validate: ['number'], default: 60 },
      songBrushUpDuration:  { validate: ['number'], default: 7 },
      songBrushUpEmail:     { validate: ['bool'], default: true },
      songGoalEmail:        { validate: ['bool'], default: true },
      visualTheme:          { default: 'steelBlue.dark' },
      normalizePoints:      { default: false },
      notificationsEmail:   { validate: ['email'] },
      customFields:         { relation: { reverse: true, type: 'oneToMany', field: 'user', table: 'fields', Model: Field } },
      songs:                { relation: { reverse: true, type: 'oneToMany', field: 'user', table: 'songs', Model: Song } },
      roles:                [], // TODO: validate oneOf('default', 'user', 'admin') -> load from config
      updatedAt:            [], // TODO: validate timestamp
    };
    /* eslint-enable max-len */
  }

  static get modelData() {
    const { tableName, modelName, tableKeys } = User;
    return { tableName, modelName, tableKeys };
  }

  static generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  }

  constructor(userData, skipValidation) {
    super(User.modelData, userData, skipValidation);
  }

  saveEvent(event, meta = {}) {
    return this.save({
      events: [...this.fields.events, {
        time: new Date().getTime(),
        event,
        meta
      }]
    });
  }

  validPassword(password) {
    if (global.__SKIP_AUTH__) {
      return true;
    }
    return password && this.fields.password ? bcrypt.compareSync(password, this.fields.password) : false;
  }
}

module.exports = User;

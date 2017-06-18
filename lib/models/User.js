const BaseModel = require('./_BaseModel');
const bcrypt = require('bcrypt');
const { log } = require('debugger-256')('api:model:user');

class User extends BaseModel {
  static get tableName () { return 'users'; }
  static get modelName () { return 'User'; }

  static get tableKeys () {
    return {
      id:                   {},
      firstName:            {},
      lastName:             {},
      email:                { required: true, validate: ['email'] },
      password:             { required: true, validate: ['password'], hidden: true },
      picture:              { validate: ['url'] },
      maxDifficulty:        { validate: ['number'], default: 10 },
      maxProgress:          { validate: ['number'], default: 4 },
      songBrushUpInterval:  { validate: ['time'], default: 60 },
      songBrushUpDuration:  { validate: ['time'], default: 7 },
      songBrushUpEmail:     { validate: ['bool'], default: true },
      songGoalEmail:        { validate: ['bool'], default: true },
      visualTheme:          { default: 'steelBlue-dark' },
      normalizePoints:      { default: false },
      notificationsEmail:   { validate: ['email'] },
      updatedAt:            {},
      customFields:         { fkey: { field: 'user', table: 'fields' } },
      songs:                { fkey: { field: 'user', table: 'songs' } }
    };
  }

  static generateHash (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  }

  constructor (userData) {
    super(User.tableName, User.tableKeys, userData);
  }

  validPassword (password) {
    if (global.__SKIP_AUTH__) {
      return true;
    }
    return password && this.fields.password ? bcrypt.compareSync(password, this.fields.password) : false;
  }

};

module.exports = exports = User;

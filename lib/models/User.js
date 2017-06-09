const BaseModel = require('./_BaseModel');
const initialUsers = require('./initialData/users');
const bcrypt = require('bcrypt');
const { log } = require('debugger-256')('api:model:user');

class User extends BaseModel {
  static get tableName () { return 'users'; }
  static get modelName () { return 'User'; }
  static get initialData () { return initialUsers; }

  static get tableKeys () {
    return {
      id:                   {},
      uid:                  {},
      firstName:            {},
      lastName:             {},
      email:                { required: true, validate: ['email'] },
      password:             { required: true, validate: ['password'] },
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
      updatedAt:            {}
    };
  }

  static generateHash (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  }

  static sanitizeKeys (data) {
    let sanitizedData = {};
    Object.keys(this.tableKeys).forEach(tableKey => {
      if (typeof data[tableKey] !== 'undefined') {
        sanitizedData[tableKey] = data[tableKey];
      }
    });
    return sanitizedData;
  }

  static populateDefaults (fields) {
    Object.keys(this.tableKeys).forEach(tableKey => {
      if (typeof fields[tableKey] === 'undefined' &&
        typeof this.tableKeys[tableKey]['default'] !== 'undefined') {
        fields[tableKey] = this.tableKeys[tableKey]['default'];
      }
    });
  }

  constructor (user) {
    super(User.tableName);
    user = user && user[0] ? user[0] : user;
    if (user) {
      this.fields = User.sanitizeKeys(user);
      this.fields.notificationsEmail = this.fields.email;
      User.populateDefaults(this.fields);
    }
  }

  validPassword (password) {
    return password && this.fields.password ? bcrypt.compareSync(password, this.fields.password) : false;
  }

  save (newFields) {
    this.fields = { ...this.fields, ...newFields };
    if (this.fields.id) {
      return super.update();
    } else {
      return super.add();
    }
  }
};

module.exports = exports = User;

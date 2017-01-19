const BaseModel = require('./_BaseModel');
const getDbModule = require("../utils/db").getDbModule;
const exampleUsers = require('./exampleData/users');
const bcrypt = require('bcrypt');
const debug = require("debug")("api:model:user");

class User extends BaseModel {
  static get tableName() { return "users"; }
  static get exampleData() { return exampleUsers }

  static get tableKeys() {
    return {
      uid:                  {},
      firstName:            {},
      lastName:             {},
      email:                { required: true, validate: ['email'] },
      password:             { required: true, validate: ['password'] },
      picture:              { validate: ['url'] },
      maxScore:             { validate: ['number'], default: 10 },
      maxStars:             { validate: ['number'], default: 4 },
      songReminder:         { validate: ['time'], default: 60 },
      songReminderDuration: { validate: ['time'], default: 7 }
    };
  }

  static generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  }

  static sanitizeKeys(data) {
    let sanitizedData = {};
    Object.keys(this.tableKeys).forEach(tableKey => {
      if (data[tableKey]) {
        sanitizedData[tableKey] = data[tableKey];
      }
    });
    return sanitizedData;
  }

  constructor(user) {
    super(User.tableName);
    if (user) {
      user = User.sanitizeKeys(user);
      Object.keys(user).forEach(userKey => {
        this[userKey] = user[userKey];
      });
      if (user.id) {
        this.uid = user.id;
      }
    }
  }

  validPassword(password) {
    return bcrypt.compareSync(password, this.password);
  }

  save() {
    const data = User.sanitizeKeys(this);

    if (this.id) {
      return super.update(data);
    } else {
      return super.add(data);
    }
  }
};

module.exports = exports = User;

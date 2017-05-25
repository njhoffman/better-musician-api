const BaseModel = require('./_BaseModel');
const getDbModule = require('../utils/db').getDbModule;
const initialGenres = require('./initialData/genres');
const { debug } = require('debugger-256')('api:model:genre');

class Genre extends BaseModel {
  static get tableName () { return 'genres'; }
  static get modelName () { return 'Genre'; }

  static get tableKeys () {
    return ['email', 'uid', 'id'];
  }

  static get initialData() { return initialGenres; }

  constructor (genre) {
    super();
  }

  save () {
    return getDbModule()
      .db
      .table(Genre.tableName)
      .insert({
        email: this.email,
        password: this.password
      })
      .run(getDbModule().conn)
      .then((res) => {
        if (res.inserted === 1) {
          this.id = res.generated_keys[0];
          return { email: this.email, id: this.id };
        } else {
          debug('ERROR %O', res);
        }
      });
  }
};
module.exports = exports = Genre;

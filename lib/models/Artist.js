const BaseModel = require('./_BaseModel');
const getDbModule = require('../utils/db').getDbModule;
const initialArtists = require('./initialData/artists');
const { debug } = require('debugger-256')('api:model:artist');

class Artist extends BaseModel {
  static get tableName () { return 'artists'; }
  static get modelName () { return 'Artist'; }
  static get tableKeys () { return ['email', 'uid', 'id']; }
  static get initialData() { return initialArtists; }

  constructor (artist) {
    super();
  }

  save () {
    return getDbModule()
      .db
      .table(Artist.tableName)
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
module.exports = exports = Artist;

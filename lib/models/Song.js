const BaseModel = require('./_BaseModel');

const { info, log, trace } = require('debugger-256')('api:model:song');

class Song extends BaseModel {
  static get tableName () { return 'songs'; }
  static get modelName () { return 'Song'; }

  static get tableKeys () {
    return {
      title:      { required: true },
      artist:     { required: true, foreignTable: 'artists' },
      instrument: { required: true, foreignTable: 'instruments' },
      genre:      { foreignTable: 'genres' },
      progress:   { validate: ['number'] },
      difficulty: { validate: ['number'] },
      customFields: { }
    };
  }

  constructor (song) {
    super();
  }

  save () {
    const data = this.sanitizeKeys(this);

    if (this.id) {
      super.update(data);
    } else {
      super.add(data);
    }
  }
};

module.exports = exports = Song;

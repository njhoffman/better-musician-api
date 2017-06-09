const BaseModel = require('./_BaseModel');
const initialSongs = require('./initialData/songs');

const { info, log, trace } = require('debugger-256')('api:model:song');

class Song extends BaseModel {
  static get tableName () { return 'songs'; }
  static get modelName () { return 'Song'; }
  static get initialData() { return initialSongs; }

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

  static generate (num = 0, mergeObj, customFields) {
    this.initialSongs = initialSongs.map(song => {
      if (song.customFields && customFields) {
        song.customFields.forEach((cf, i) => {
          cf.id = customFields[i];
        });
      }
      trace('Merged custom into song', song);
      return song;
    });
    return super.generate(num, mergeObj);
  }

  constructor (song) {
    super();
  }

  save () {
    const data = this.sanitizeKeys(this);

    if (this.id) {
      this.update(data);
    } else {
      this.update(data);
    }
  }
};

module.exports = exports = Song;

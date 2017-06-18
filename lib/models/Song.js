const { find } = require('lodash');
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

  static get seedData () {
    let seedData = super.seedData.map(sd => {
      if (this.customFields && Array.isArray(sd.customFields)) {
        sd.customFields = sd.customFields.map(cf => {
          const { id } = find(this.customFields, { ref: cf.refId });
          cf.id = id;
          return cf;
        });
      }
      return sd;
    });
    return seedData;
  };

  static seed (num = 0, mergeObj = {}) {
    const { user } = mergeObj;
    return (user ? this.findByField({ user }, 'fields') : Promise.resolve(false))
      .then(customFields => {
        this.customFields = customFields;
        return super.seed(num, mergeObj);
      });
  }

  constructor (songData) {
    super(Song.tableName, song.tableKeys, songData);
  }

};

module.exports = exports = Song;

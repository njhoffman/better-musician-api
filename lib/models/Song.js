const { find } = require('lodash');
const BaseModel = require('./_BaseModel');
const Artist = require('./Artist');
const Instrument = require('./Instrument');
const User = require('./User');
const Genre = require('./Genre');

const { info, debug, trace } = require('../utils/logger')('api:model:song');

class Song extends BaseModel {
  static get tableName () { return 'songs'; }
  static get modelName () { return 'Song'; }

  static get tableKeys () {
    return {
      id:         {},
      title:      { required: true },
      user:       { required: true, relation: { model: User, allowId: true } },
      artist:     { required: true, relation: { model: Artist } },
      instrument: { required: true, relation: { model: Instrument } },
      genre:      { relation: { model: Genre } },
      progress:   { validate: ['number'] },
      difficulty: { validate: ['number'] },
      updatedAt:  {},
      customFields: {  }
    };
  }

  static get modelData () {
    const { tableName, modelName, tableKeys } = Song;
    return { tableName, modelName, tableKeys };
  }

  static get seedData () {
    // when seeding songs, associate pre-defined customFields with refId
    // of unique user created field
    let seedData = super.seedData.map(sd => {
      if (this.customFields && Array.isArray(sd.customFields)) {
        sd.customFields = sd.customFields.map(cf => {
          const targetCf = find(this.customFields, { ref: cf.refId });
          cf.id = targetCf.id;
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

  constructor (songData, skipValidation) {
    super(Song.modelData, songData, skipValidation);
  }

};

module.exports = exports = Song;

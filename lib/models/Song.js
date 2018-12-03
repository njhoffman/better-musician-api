const BaseModel = require('lib/models/_BaseModel');
const Artist = require('lib/models/Artist');
const Instrument = require('lib/models/Instrument');
const User = require('lib/models/User');
const Genre = require('lib/models/Genre');

// const { warn } = require('../utils/logger')('api:model:song');

class Song extends BaseModel {
  static get tableName() { return 'songs'; }

  static get modelName() { return 'Song'; }

  static get tableKeys() {
    return {
      id:           {},
      title:        { required: true },
      user:         { required: true, relation: { Model: User }, default: this.userId, authLock: ['admin'] },
      artist:       { required: true, relation: { Model: Artist } },
      instrument:   { required: true, relation: { Model: Instrument } },
      genre:        { relation: { Model: Genre } },
      progress:     { validate: ['number'] },
      difficulty:   { validate: ['number'] },
      userFields:   {},
      updatedAt:    []
    };
  }

  static get modelData() {
    const { tableName, modelName, tableKeys } = Song;
    return { tableName, modelName, tableKeys };
  }

  constructor(songData, parent) {
    super(Song.modelData, songData, parent);
  }
}

module.exports = Song;

const BaseModel = require('./_BaseModel');
const getDbModule = require('../utils/db').getDbModule;
const exampleSongs = require('./exampleData/songs');

const { info, log } = require('debugger-256')('api:model:song');

class Song extends BaseModel {
  static get tableName () { return 'songs'; }
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
  static get exampleData () {
    return this.exampleSongs;
  }
  static set exampleData (newData) {
    this.exampleSongs = newData;
  }

  // static generate (num = 0, mergeObj, customFields) {
  //   this.exampleData = exampleSongs.map(song => {
  //     if (song.customFields) {
  //       song.customFields.forEach((cf, i) => {
  //         cf.id = customFields[i];
  //       });
  //     }
  //     return song;
  //   });
  //   return super.generate(num, mergeObj);
  // }
  static findRelatedByUserId (uid) {
    // TODO: switch this to only returning filtered related data when dynamic lookup fields complete
    let retObj = {};
    let songs;

    const rArgs = getDbModule().r.args;
    return this.findByField({ user: uid })
      .then(_songs => {
        retObj.songs = songs = _songs;
        retObj.songs = retObj.songs.map(song => {
          if (song.customFields) {
            song.customFieldIds = song.customFields.map(cf => cf.id);
          }
          return song;
        });
        let artists = songs.map(song => song.artist);
        artists = artists.filter((artist, pos, self) => self.indexOf(artist) === pos);
        return getDbModule()
          .db
          .table('artists')
          // .getAll(rArgs(artists))
          .coerceTo('array')
          .run(getDbModule().conn);
      }).then(artists => {
        retObj.artists = artists;
        let instruments = songs.map(song => song.instrument);
        instruments = instruments.filter((instrument, pos, self) => self.indexOf(instrument) === pos);
        return getDbModule()
          .db
          .table('instruments')
          // .getAll(rArgs(instruments))
          .coerceTo('array')
          .run(getDbModule().conn);
      }).then(instruments => {
        retObj.instruments = instruments;
        let genres = songs.map(song => song.genre);
        genres = genres.filter((genre, pos, self) => self.indexOf(genre) === pos);
        return getDbModule()
          .db
          .table('genres')
          // .getAll(rArgs(genres))
          .coerceTo('array')
          .run(getDbModule().conn);
      }).then(genres => {
        retObj.genres = genres;
        return getDbModule()
          .db
          .table('fields')
          .filter({ user: uid })
          // .getAll(rArgs(genres))
          .coerceTo('array')
          .run(getDbModule().conn);
      }).then(fields => {
        retObj.fields = fields;
        return retObj;
      });
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

Song.exampleData = exampleSongs;
module.exports = exports = Song;

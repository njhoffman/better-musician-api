const exampleUsers = require('./exampleData/users');
const exampleSongs = require('./exampleData/songs');
const exampleArtists = require('./exampleData/artists');
const exampleGenres = require('./exampleData/genres');
const exampleInstruments = require('./exampleData/instruments');

const BaseModel = require('./_BaseModel');
const bcrypt = require("bcrypt");
const getDbModule = require("../utils/db").getDbModule;

const debug = require("debug")("api:model");

class User extends BaseModel {
  static get tableName() { return "users"; }
  static get tableKeys() {
    return {
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
  static get exampleData() { return exampleUsers }
  constructor(user) {
    super();
    this.email = user.email;
    this.password = user.password;
    this.points = user.points;
  }
  static generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  }
  static findByEmail(email) {
    return getDbModule()
      .db
      .table(this.tableName)
      .filter({ email: email })
      .coerceTo('array')
      .run(getDbModule().conn);
  }
  validPassword(password) {
    return bcrypt.compareSync(password, this.password);
  }
  save() {
    return getDbModule()
      .db
      .table(User.tableName)
      .insert({
        email: this.email,
        password: this.password,
        points: this.points
      })
      .run(getDbModule().conn)
      .then((res) => {
        if (res.inserted === 1) {
          this.id = res.generated_keys[0];
          return {
            email: this.email,
            id: this.id,
            points: this.points
          };
        } else {
          debug("ERROR %O", res);
        }
      });
  }
};
exports.User = User;

class Song extends BaseModel {
  static get tableName() { return "songs" }
  static get tableKeys() {
    return {
      title: { required: true },
      artist: { required: true, foreignTable: 'artists' },
      instrument: { required: true, foreignTable: 'instruments' },
      genre: { foreignTable: 'genres' },
      progress: { validate: ['number'] },
      difficulty: { validate: ['number'] }
    };
  }
  static get exampleData() { return exampleSongs; }
  constructor(song) {
    super();
  }
  static findByUserId(uid) {
    return getDbModule()
      .db
      .table(this.tableName)
      .filter({ user: uid })
      .coerceTo('array')
      .run(getDbModule().conn);
  }
  static findRelatedByUserId(uid) {
    let retObj = {};
    let songs;

    const rArgs = getDbModule().r.args;
    return this.findByUserId(uid)
      .then(_songs => {
        retObj.songs = songs = _songs;
        let artists = songs.map(song => song.artist);
        artists = artists.filter((artist, pos, self) => self.indexOf(artist) === pos);
        debug('trying to get %O', artists);
        return getDbModule()
          .db
          .table('artists')
          .getAll(rArgs(artists))
          .coerceTo('array')
          .run(getDbModule().conn);
      }).then(artists => {
        retObj.artists = artists;
        let instruments = songs.map(song => song.instrument);
        instruments = instruments.filter((instrument, pos, self) => self.indexOf(instrument) === pos);
        debug('trying to get %O %O', instruments, artists);
        return getDbModule()
          .db
          .table('instruments')
          .getAll(rArgs(instruments))
          .coerceTo('array')
          .run(getDbModule().conn);
      }).then(instruments => {
        retObj.instruments = instruments;
        let genres = songs.map(song => song.genre);
        genres = genres.filter((genre, pos, self) => self.indexOf(genre) === pos);
        debug('trying to get %O %O', genres, instruments);
        return getDbModule()
          .db
          .table('genres')
          .getAll(rArgs(genres))
          .coerceTo('array')
          .run(getDbModule().conn);
      }).then(genres => {
        retObj.genres = genres;
        return retObj;
      });

  }
  save() {
    return getDbModule()
      .db
      .table(Song.tableName)
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
          debug("ERROR %O", res);
        }
      });
  }
};
exports.Song = Song;

class Artist extends BaseModel {
  static get tableName() { return "artists" }
  static get tableKeys() {
    return ["email", "uid", "id"];
  }
  static get exampleData() { return exampleArtists; }
  constructor(artist) {
    super();
  }
  save() {
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
          debug("ERROR %O", res);
        }
      });
  }
};
exports.Artist = Artist;

class Genre extends BaseModel {
  static get tableName() { return "genres" }
  static get tableKeys() {
    return ["email", "uid", "id"];
  }
  static get exampleData() { return exampleGenres; }
  constructor(genre) {
    super();
  }
  save() {
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
          debug("ERROR %O", res);
        }
      });
  }
};
exports.Genre = Genre;

class Instrument extends BaseModel {
  static get tableName() { return "instruments" }
  static get tableKeys() {
    return ["email", "uid", "id"];
  }
  static get exampleData() { return exampleInstruments; }
  constructor(instrument) {
    super();
  }
  save() {
    return getDbModule()
      .db
      .table(Instrument.tableName)
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
          debug("ERROR %O", res);
        }
      });
  }
};
exports.Instrument = Instrument;

exports.Models = {
  User,
  Song,
  Artist,
  Instrument,
  Genre
}

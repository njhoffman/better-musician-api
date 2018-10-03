const { map, uniq, flatten, filter } = require('lodash');
const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;

const { info, trace } = require('../../utils/logger')('api:routes:songs');

export default function (passport, models) {
  // fetch songs for authenticated users
  const { Song, Artist, Instrument, Genre, Field } = models;

  const filterSongField = (songs, fieldName) => {
    return uniq(
      filter(map(songs, fieldName),
        (field) => field !== undefined
      )
    );
  };

  const fetchSongs = (req, res, next) => {
    const id = req.user.id;
    let tables = {};
    info({ color: 'bold' }, `Fetch songs for user %${req.user.email}% (${id})`);
    return Song.findByField({ user: id })
      .then(songs => {
        tables.songs = songs;
        return Artist.all;
        // return Artist.findByIds(filterSongField(songs, 'artist'));
      }).then(artists => {
        tables.artists = artists;
        return Instrument.all;
        // return Instrument.findByIds(filterSongField(tables.songs, 'instrument'));
      }).then(instruments => {
        tables.instruments = instruments;
        return Genre.all;
        // return Genre.findByIds(filterSongField(tables.songs, 'genre'));
      }).then(genres => {
        tables.genres = genres;
        const ids = uniq(flatten(
          map(tables.songs, song => {
            return song.customFields ? song.customFields.map(cf => cf.id) : false;
          })
        ));
        return Field.findByIds(ids);
      }).then(fields => {
        tables.fields = fields;
        info({
          Song: tables.songs.length,
          Artist: tables.artists.length,
          Instrument: tables.instruments.length,
          Genre: tables.genres.length,
          Field: tables.fields.length,
        }, 'Fetch songs results:');
        // trace({ tables }, 'Fetch songs Results');
        res.json({
          status: 200,
          data: {
            tables: tables
          }
        });
      }).catch(next);
  };

  const emptySongs = (req, res, next) => {
    return Song.empty()
      .then(results => {
        return res.json({ status: 200 });
      }).catch(next);
  };

  const addSong = (req, res, next) => {
    const { user: { id }, body } = req;
    const songData = { ...body, user: id };
    return Song.save(songData)
      .then(results => {
        return res.json({ status: 200, data: results });
      }).catch(next);
  };

  const deleteSong = (req, res, next) => {
    const { user: { id }, body } = req;
    const songData = { id: body.id,  user: id };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.json({ status: 400, data: { error: 'No id in request body' } });
    }
    return Song.delete(songData)
      .then(results => {
        res.json({ status: 200, data: results });
      }).catch(next);
  };

  router.get('/',               passport.authenticate('jwt', { failWithError: true, session: false }), fetchSongs);
  router.get('/empty',          passport.authenticate('jwt', { failWithError: true, session: false }), emptySongs);
  router.post('/add',           passport.authenticate('jwt', { failWithError: true, session: false }), addSong);
  router.post('/delete',        passport.authenticate('jwt', { failWithError: true, session: false }), deleteSong);

  return router;
}

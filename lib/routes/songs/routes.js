
const { map, uniq, flatten, filter } = require('lodash');
const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;

const { info, log } = require('debugger-256')('api:songs');

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

  const fetchSongs = (req, res) => {
    const id = req.user.id;
    let tables = {};
    log(`Fetch songs for user ${req.user.email}`);
    return Song.findByField({ user: id })
      .then(songs => {
        tables.songs = songs;
        return Artist.findByIds(filterSongField(songs, 'artist'));
      }).then(artists => {
        tables.artists = artists;
        return Instrument.findByIds(filterSongField(tables.songs, 'instrument'));
      }).then(instruments => {
        tables.instruments = instruments;
        return Genre.findByIds(filterSongField(tables.songs, 'genre'));
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
        res.json({
          status: 200,
          data: {
            tables: tables
          }
        });
      });
  };

  const emptySongs = (req, res, next) => {
    return Song.empty()
      .then(results => {
        return res.json({ status: 200 });
      });
  };

  const addSong = (req, res, next) => {
    const { user: { id }, body } = req;
    const songData = { ...body, ...{ user: id } };
    return Song.save(songData)
      .then(results => {
        return res.json({ status: 200, data: results });
      })
  }

  const deleteSong = (req, res, next) => {
    const { user: { id }, body } = req;
    const songData = { ...{ id: body.id}, ...{ user: id } };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.json({ status: 400, data: { error: 'No id in request body' } });
    }
    return Song.delete(songData)
      .then(results => {
        res.json({ status: 200, data: results });
      })
  }

  router.get('/',               passport.authenticate('jwt', { failWithError: true, session: false }), fetchSongs);
  router.get('/empty',          passport.authenticate('jwt', { failWithError: true, session: false }), emptySongs);
  router.post('/add',           passport.authenticate('jwt', { failWithError: true, session: false }), addSong);
  router.post('/delete',        passport.authenticate('jwt', { failWithError: true, session: false }), deleteSong);

  return router;
}

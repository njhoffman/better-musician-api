const { map, uniq, flatten, filter } = require('lodash');
const router = require('express').Router();

const { info } = require('../../utils/logger')('api:routes:songs');

// only return foreign keys attached to user when alternative lookups implemented
const allForeignKeys = true;

const SongRoutes = (passport, models) => {
  // fetch songs for authenticated users
  const { Song, Artist, Instrument, Genre, Field } = models;

  const filterSongField = (songs, fieldName) => (
    uniq(
      filter(
        map(songs, fieldName),
        (field) => field !== undefined
      )
    )
  );

  const fetchSongs = ({ user: { id, email } }, res, next) => {
    const tables = {};
    info({ color: 'bold' }, `Fetch songs for user %${email}% (${id})`);
    return Song.findByField({ user: id })
      .then(songs => {
        tables.songs = songs;
        return allForeignKeys
          ? Artist.all
          : Artist.findByIds(filterSongField(songs, 'artist'));
      })
      .then(artists => {
        tables.artists = artists;
        return allForeignKeys
          ? Instrument.all
          : Instrument.findByIds(filterSongField(tables.songs, 'instrument'));
      })
      .then(instruments => {
        tables.instruments = instruments;
        return Genre.all;
        // return Genre.findByIds(filterSongField(tables.songs, 'genre'));
      })
      .then(genres => {
        tables.genres = genres;
        const ids = uniq(
          flatten(
            map(tables.songs, song => (song.customFields ? song.customFields.map(cf => cf.id) : false))
          )
        ).filter(Boolean);
        return Field.findByIds(ids);
      })
      .then(fields => {
        tables.fields = fields;
        info({
          Song: tables.songs.length,
          Artist: tables.artists.length,
          Instrument: tables.instruments.length,
          Genre: tables.genres.length,
          Field: tables.fields.length,
        }, `Fetch songs results for ${email} (${id})`);
        // trace({ tables }, 'Fetch songs Results');
        res.status(200).json({ data: tables });
      })
      .catch(next);
  };

  const emptySongs = (req, res, next) => (
    Song.empty()
      .then(results => res.status(200).end())
      .catch(next)
  );

  const addSong = (req, res, next) => {
    const { user: { id }, body } = req;
    const songData = { ...body, user: id };
    return Song.save(songData)
      .then(results => res.status(200).json({ data: results }))
      .catch(next);
  };

  const deleteSong = (req, res, next) => {
    const { user: { id }, body } = req;
    const songData = { id: body.id, user: id };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.status(400).json({ error: 'No id in request body' });
    }
    return Song.delete(songData)
      .then(results => res.status(200).json({ data: results }))
      .catch(next);
  };

  /* eslint-disable no-multi-spaces */
  router.get('/',               passport.authenticate('jwt', { failWithError: true, session: false }), fetchSongs);
  router.get('/empty',          passport.authenticate('jwt', { failWithError: true, session: false }), emptySongs);
  router.post('/add',           passport.authenticate('jwt', { failWithError: true, session: false }), addSong);
  router.post('/delete',        passport.authenticate('jwt', { failWithError: true, session: false }), deleteSong);
  /* eslint-enable no-multi-spaces */

  return router;
};

export default SongRoutes;

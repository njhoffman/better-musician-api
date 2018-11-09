const { map, uniq, flatten, filter } = require('lodash');
const router = require('express').Router();

// only return foreign keys attached to user when alternative lookups implemented
const allForeignKeys = true;

let allModels;
let reqLogger;
const SongRoutes = (passport) => {
  // fetch songs for authenticated users

  const handleRoute =  (req, res, next) => {
    reqLogger = req.logger.child({ subsystem: 'routes:songs' });
    allModels = req._models_;
    reqLogger.debug('attempting JWT authentication');
    passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
  };

  const filterSongField = (songs, fieldName) => (
    uniq(
      filter(
        map(songs, fieldName),
        (field) => field !== undefined
      )
    )
  );

  const fetchSongs = (req, res, next) => {
    const { id, email } = req.user;
    const tables = {};
    const { Song, Artist, Instrument, Genre, Field } = allModels;
    reqLogger.info({ color: 'bold' }, `Fetch songs for user %${email}% (${id})`);
    return Song.findByField({ user: id })
      .then(songs => {
        tables.songs = songs;
        return allForeignKeys
          ? Artist.all()
          : Artist.findByIds(filterSongField(songs, 'artist'));
      })
      .then(artists => {
        tables.artists = artists;
        return allForeignKeys
          ? Instrument.all()
          : Instrument.findByIds(filterSongField(tables.songs, 'instrument'));
      })
      .then(instruments => {
        tables.instruments = instruments;
        return Genre.all();
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
        reqLogger.info({
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
    allModels.Song.empty()
      .then(results => res.status(200).end())
      .catch(next)
  );

  const addSong = (req, res, next) => {
    const { user, body } = req;
    const { Song } = allModels;
    const songData = { ...body, user: user.id };
    return Song.save(songData)
      .then(results => res.status(200).json({ data: results }))
      .catch(next);
  };

  const deleteSong = (req, res, next) => {
    const { user = {}, body } = req;
    const { Song } = allModels;
    const songData = { id: body.id, user: user.id };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.status(400).json({ error: 'No id in request body' });
    }
    return Song.delete(songData)
      .then(results => res.status(200).json({ data: results }))
      .catch(next);
  };

  /* eslint-disable no-multi-spaces */
  router.get('/',        handleRoute, fetchSongs);
  router.get('/empty',   handleRoute, emptySongs);
  router.post('/add',    handleRoute, addSong);
  router.post('/delete', handleRoute, deleteSong);
  /* eslint-enable no-multi-spaces */

  return router;
};

export default SongRoutes;

const { map, uniq, flatten, filter } = require('lodash');
const router = require('express').Router();

let reqLogger;
const SongRoutes = (passport, respondSuccess, respondError) => {
  // fetch songs for authenticated users

  const handleRoute =  (req, res, next) => {
    reqLogger = req.logger.child({ subsystem: 'routes:songs' });
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
    const { Song, Artist, Instrument, Genre, Field, FieldTab } = req._models_;
    const { id, email } = req.user;
    const tables = {};
    reqLogger.info({ color: 'bold' }, `Fetch songs for user %${email}% (${id})`);

    // only return foreign keys attached to user when alternative lookups implemented
    // probably want to return separate shallow tables here for redux-orm to reconstruct
    const allForeignKeys = true;

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
        return allForeignKeys
          ? Genre.all()
          : Genre.findByIds(filterSongField(tables.songs, 'genre'));
      })
      .then(genres => {
        tables.genres = genres;
        return FieldTab.findByField({ user: id });
      })
      .then(fieldTabs => {
        tables.fieldTabs = fieldTabs;
        const songUserFieldIds = uniq(
          flatten(
            map(tables.songs, song => (song.userFields ? song.userFields.map(uf => uf.id) : false))
          )
        ).filter(Boolean);
        return allForeignKeys
          ? Field.findByField({ user: id })
          : Field.findByIds(songUserFieldIds);
      })
      .then(fields => {
        tables.fields = fields;
        reqLogger.info({
          Song       : tables.songs.length,
          Artist     : tables.artists.length,
          Instrument : tables.instruments.length,
          Genre      : tables.genres.length,
          Field      : tables.fields.length,
          FieldTab   : tables.fieldTabs.length,
        }, `Fetch songs results for ${email} (${id})`);
        // trace({ tables }, 'Fetch songs Results');
        respondSuccess('query', { records: tables })(req, res);
      })
      .catch(next);
  };

  const emptySongs = (req, res, next) => {
    const { Song } = req._models_;
    return Song.empty()
      .then(results => respondSuccess('delete', results))
      .catch(next);
  };

  const addSong = (req, res, next) => {
    const { Song } = req._models_;
    const { id: userId } = req.user;
    return Song.save({ ...req.body, user: userId })
      .then(data => respondSuccess('create', data)(req, res, next))
      .catch(next);
  };

  const updateSong = (req, res, next) => {
    const { Song } = req._models_;
    return Song.save(req.body)
      .then(data => respondSuccess('update', data)(req, res, next))
      .catch(next);
  };

  const deleteSong = (req, res, next) => {
    const { Song } = req._models_;
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.status(400).json({ error: 'No id in request body' });
    }
    return Song.delete(bodyId)
      .then(data => respondSuccess('delete', data)(req, res))
      .catch(next);
  };

  /* eslint-disable no-multi-spaces */
  router.get('/',        handleRoute, fetchSongs);
  router.get('/empty',   handleRoute, emptySongs);
  router.post('/add',    handleRoute, addSong);
  router.post('/update', handleRoute, updateSong);
  router.post('/delete', handleRoute, deleteSong);
  /* eslint-enable no-multi-spaces */

  return router;
};

export default SongRoutes;

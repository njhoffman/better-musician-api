const router = require('express').Router();

let reqLogger;
let Artist;
export default function ArtistRoutes(passport) {
  // fetch artists for authenticated users

  const handleRoute =  (req, res, next) => {
    reqLogger = req.logger.child({ subsystem: 'routes:artists' });
    ({ Artist } = req._models_);
    reqLogger.debug('attempting JWT authentication');
    passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
  };

  const fetchArtists = ({ user: { email, id } }, res, next) => {
    const tables = {};
    reqLogger.info({ color: 'bold' }, `Fetch artists for user %${email}% (${id})`);
    return Artist.all()
      .then(artists => {
        tables.artists = artists;
        reqLogger.info({ Artist: tables.artists.length, }, 'Fetch artists results:');
        res.status(200).json({ records: tables });
      })
      .catch(next);
  };

  const emptyArtists = (req, res, next) => (
    Artist.empty()
      .then(results => res.status(200).end())
      .catch(next)
  );

  const addArtist = (req, res, next) => {
    const { user: { id }, body } = req;
    const artistData = { ...body, user: id };
    return Artist.save(artistData)
      .then(results => res.status(200).json({ records: results }))
      .catch(next);
  };

  const deleteArtist = (req, res, next) => {
    const { user: { id }, body } = req;
    const artistData = { id: body.id, user: id };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.status(400).json({ error: 'No id in request body' });
    }
    return Artist.delete(artistData)
      .then(results => {
        res.status(200).json({ records: results });
      })
      .catch(next);
  };

  /* eslint-disable no-multi-spaces */
  router.get('/',        handleRoute, fetchArtists);
  router.get('/empty',   handleRoute, emptyArtists);
  router.post('/add',    handleRoute, addArtist);
  router.post('/delete', handleRoute, deleteArtist);
  /* eslint-enable no-multi-spaces */

  return router;
}

const router = require('express').Router();

const { info } = require('../../utils/logger')('api:routes:artists');

export default function ArtistRoutes(passport, models) {
  // fetch artists for authenticated users
  const { Artist } = models;

  const fetchArtists = ({ user: { email, id } }, res, next) => {
    const tables = {};
    info({ color: 'bold' }, `Fetch artists for user %${email}% (${id})`);
    return Artist.all
      .then(artists => {
        tables.artists = artists;
        info({ Artist: tables.artists.length, }, 'Fetch artists results:');
        res.status(200).json({ data: tables });
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
      .then(results => res.status(200).json({ data: results }))
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
        res.status(200).json({ data: results });
      })
      .catch(next);
  };

  /* eslint-disable no-multi-spaces */
  router.get('/',               passport.authenticate('jwt', { failWithError: true, session: false }), fetchArtists);
  router.get('/empty',          passport.authenticate('jwt', { failWithError: true, session: false }), emptyArtists);
  router.post('/add',           passport.authenticate('jwt', { failWithError: true, session: false }), addArtist);
  router.post('/delete',        passport.authenticate('jwt', { failWithError: true, session: false }), deleteArtist);
  /* eslint-enable no-multi-spaces */

  return router;
}

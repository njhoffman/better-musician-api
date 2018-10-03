const { map, uniq, flatten, filter } = require('lodash');
const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;

const { info, trace } = require('../../utils/logger')('api:routes:artists');

export default function (passport, models) {
  // fetch artists for authenticated users
  const { Artist } = models;

  const fetchArtists = (req, res, next) => {
    const id = req.user.id;
    let tables = {};
    info({ color: 'bold' }, `Fetch artists for user %${req.user.email}% (${id})`);
    return Artist.all
      .then(artists=> {
        tables.artists = artists ;
        info({ Artist: tables.artists.length, }, 'Fetch artists results:');
        res.json({
          status: 200,
          data: {
            tables: tables
          }
        });
      }).catch(next);
  };

  const emptyArtists = (req, res, next) => {
    return Artist.empty()
      .then(results => {
        return res.json({ status: 200 });
      }).catch(next);
  };

  const addArtist = (req, res, next) => {
    const { user: { id }, body } = req;
    const artistData = { ...body, user: id };
    return Artist.save(artistData)
      .then(results => {
        return res.json({ status: 200, data: results });
      }).catch(next);
  };

  const deleteArtist = (req, res, next) => {
    const { user: { id }, body } = req;
    const artistData = { id: body.id,  user: id };
    const bodyId = req.body.id !== undefined ? req.body.id : false;
    if (!bodyId) {
      return res.json({ status: 400, data: { error: 'No id in request body' } });
    }
    return Artist.delete(artistData)
      .then(results => {
        res.json({ status: 200, data: results });
      }).catch(next);
  };

  router.get('/',               passport.authenticate('jwt', { failWithError: true, session: false }), fetchArtists);
  router.get('/empty',          passport.authenticate('jwt', { failWithError: true, session: false }), emptyArtists);
  router.post('/add',           passport.authenticate('jwt', { failWithError: true, session: false }), addArtist);
  router.post('/delete',        passport.authenticate('jwt', { failWithError: true, session: false }), deleteArtist);

  return router;
}

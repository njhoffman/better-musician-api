
const { map, uniq, flatten } = require('lodash');
const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;

const { info, log } = require('debugger-256')('api:songs');

export default function (passport, models) {
  // fetch songs for authenticated users
  const { Song, Artist, Instrument, Genre, Field } = models;
  const fetchSongs = (req, res) => {
    const uid = req.user.id;
    let tables = {};
    info(`Fetch songs for user ${req.user.email}`);
    return Song.findByField({ user: uid })
      .then(songs => {
        tables.songs = songs;
        return Artist.findByIds(uniq(map(songs, 'artist')));
      }).then(artists => {
        tables.artists = artists;
        return Instrument.findByIds(uniq(map(tables.songs, 'instrument')));
      }).then(instruments => {
        tables.instruments = instruments;
        return Genre.findByIds(uniq(map(tables.songs, 'genre')));
      }).then(genres => {
        tables.genres = genres;
        const customFieldIds = uniq(flatten(
          map(tables.songs, song => {
            return song.customFields.map(cf => cf.id);
          })
        ));
        return Field.findByIds(customFieldIds);
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
    const uid = req.user.id;
    const num = req.params.number ? req.params.number : 5;
    return Song.seed(num, { user: uid })
      .then(results => {
        if (results.errors === 0) {
          res.json({ status: 200 });
        } else {
          throw new Error(results.first_error);
        }
      }).catch(next);
  };

  const seedSongs = (req, res, next) => {
    const uid = req.user.id;
    const num = req.params.number ? req.params.number : 5;
    return Song.seed(num, { user: uid })
      .then(results => {
        if (results.errors === 0) {
          res.json({ status: 200 });
        } else {
          throw new Error(results.first_error);
        }
      }).catch(next);
  };

  router.post('/add',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res) => {
      res.json({
        status: 200,
        data: req.user
      });
    });

  router.post('/delete',
    passport.authenticate('jwt', { failWithError: true, session: false }),
    (req, res) => {
      res.json({ status: 200 });
    });

  router.get('/', passport.authenticate('jwt', { failWithError: true, session: false }), fetchSongs);
  router.get('/seed/:number*?', passport.authenticate('jwt', { failWithError: true, session: false }), seedSongs);
  router.get('/empty', passport.authenticate('jwt', { failWithError: true, session: false }), emptySongs);

  return router;
}

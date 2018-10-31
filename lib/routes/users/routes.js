const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;
const { getConfig } = require('../../../config/project.config');

const { info, warn } = require('../../utils/logger')('api:routes:users');
const { seedNewUser } = require('./lib');

const UserRoutes = (passport, models) => {
  const { User, Song, Field } = models;

  const setupAuth = (req, res) => {
    const { API_SECRET } = getConfig();
    const token = createToken(req.user, API_SECRET);
    req.user.uid = req.user.id;
    info({ user: req.user }, `setting up auth headers for ${req.user.email}`);
    res.set({
      'access-token' : token,
      'token-type' : 'JWT',
      uid : req.user.uid
    });
    // app.set('expiry', 6666666);
  };

  const registerSuccess = (req, res, next) => {
    setupAuth(req, res);
    info(`Registered user ${req.user.id}, email: ${req.user.email}`);
    return seedNewUser(req.user.email, 0, { User, Song, Field })
      .then((results) => res.status(200).json({ data: results }))
      .catch(next);
  };

  const registerFail = ({ status, message }, req, res, next) => {
    let msg = message;
    if (status === 401) {
      msg = 'An account with that email is already registered';
      res.status(status).send({ name: 'RegisterError', msg });
      // res.status(err.status).send({ errors: [err.message] });
    } else if (status === 400) {
      msg = 'Bad Request: Password required';
      res.status(status).send({ name: 'RegisterError', msg });
      // res.status(err.status).send({ errors: [err.message] });
    } else {
      throw new Error(`Registration failure: ${status} ${msg}`);
    }
  };

  const loginSuccess =  (req, res) => {
    setupAuth(req, res);
    const { user: { email, id } } = req;
    info({ color: 'cyan' }, `User logged in: ${id},  email: %${email}%`);
    res.status(200).json({ data: req.user });
  };

  const loginFail = ({ message, status }, req, res, next) => {
    let msg = message;
    if (status === 401) {
      msg = 'Incorrect username or password';
      res.status(status).send({ name: 'LoginError', msg });
      // res.status(err.status).send({ errors: [err.message] });
    } else if (status === 400) {
      msg = 'Password required';
      res.status(status).send({ name: 'LoginError', msg });
    } else {
      throw new Error(`Login failure: ${status} ${msg}`);
    }
  };

  const seedUser = ({ params: { email = 'testuser@example.com', num = 0 } }, res, next) => (
    // TODO: get rid of this!
    seedNewUser(email, 0, { User, Song, Field })
      .then(results => {
        info({ results }, 'done seeding songs');
        res.status(200).json({ data: results });
      })
      .catch(next)
  );

  const updateUser = (req, res, next) => {
    User.modelByField({ email: req.user.email })
      .then(user => {
        if (!user) {
          warn(`Authenticated user ${req.user.email} not found`);
          return res.status(200).json({ user:null });
        }
        return user.save(req.body);
      })
      .then(savedUser => (
        res.status(200).json({ data: savedUser })
      ))
      .catch(next);
  };

  const validateToken = (req, res, next) => {
    User.modelByField({ email: req.user.email })
      .then(user => {
        if (!user) {
          warn(`Authenticated user ${req.user.email} not found`);
          return res.status(200).json({ user: null });
        }
        info({ _trace: { _loginSuccess: user.cleanFields } }, `User validated ${user.cleanFields.email}`);
        return res.status(200).json({ data: user.cleanFields });
      })
      .catch(next);
  };

  const showMe = (req, res) => {
    info('Me is ...', req.user);
    if (!req.user) {
      res.status(200).json({ user:null });
    } else {
      res.status(200).json({ user: req.user });
    }
  };

  const logOut = (req, res, next) => {
    User.modelById(req.user.id)
      .then(user => {
        info({ user }, 'Logging out, dont forget to save info to the database...');
        req.logOut();
        return res.status(200).json({ success: true });
      })
      .catch(next);
  };

  router.post(
    '/register',
    passport.authenticate('local-signup', { failWithError: true, session: false }),
    registerSuccess,
    registerFail
  );

  router.post(
    '/login',
    passport.authenticate('local-login', { failWithError: true, session: false }),
    loginSuccess,
    loginFail
  );

  /* eslint-disable no-multi-spaces */
  router.post('/update',        passport.authenticate('jwt', { session: false }), updateUser);
  router.get('/seed/:email?/:num', /* passport.authenticate('jwt', { session: false }), */ seedUser);
  router.get('/validate_token', passport.authenticate('jwt', { session: false }), validateToken);
  router.get('/me',             passport.authenticate('jwt', { session: false }), showMe);
  router.all('/logout',         passport.authenticate('jwt', { session: false }), logOut);
  /* eslint-enable no-multi-spaces */

  return router;

  /*
      # Facebook login routes
      app.get '/auth/facebook', passport.authenticate 'facebook', æ scope: 'email'
      app.get '/auth/facebook/callback', passport.authenticate 'facebook', æ successRedirect : '/profile',  failureRedirect : '/' å

      # Twitter login routes
      app.get '/auth/twitter', passport.authenticate 'twitter'
      app.get '/auth/twitter/callback', passport.authenticate 'twitter', æ successRedirect : '/profile',  failureRedirect : '/' å

      # Google login routes
      app.get '/auth/google', passport.authenticate 'google', æ scope: Æ'profile', 'email'Åå
      app.get '/auth/google/callback', passport.authenticate 'google', æ successRedirect : '/profile',  failureRedirect : '/' å
  */
};

export default UserRoutes;

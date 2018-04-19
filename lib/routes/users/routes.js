const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;
const { getConfig } = require('../../../config/project.config');

const { info, warn } = require('../../utils/logger')('api:routes:users');
const { seedNewUser } = require('./lib');

export default function (passport, models) {
  const { User } = models;

  const setupAuth = (req, res) => {
    const { api_secret } = getConfig();
    const token = createToken(req.user, api_secret);
    req.user.uid = req.user.email;
    res.set({
      'access-token' : token,
      'token-type' : 'JWT',
      'uid' : req.user.uid
    });
    // app.set('expiry', 6666666);
  };

  const registerUser = (req, res) => {
    setupAuth(req, res);
    info(`Registered user ${req.user.id}, email: ${req.user.email}`);
    seedNewUser(req.user.id, models)
      .then(() => {
        res.json({
          status: 200,
          data: req.user
        })
      });
  };

  const registerFail = (err, req, res, next) => {
    if (err.status === 401) {
      err.message = 'An account with that email is already registered';
      res.status(err.status).send({ errors: [err.message] });
    } else if (err.status === 400) {
      err.message = 'Bad Request: Password required';
      res.status(err.status).send({ errors: [err.message] });
    } else {
      throw new Error(`Registration failure: ${err.status} ${err.message}`);
    }
  };

  const loginUser =  (req, res) => {
    setupAuth(req, res);
    info(`User logged in: ${req.user.id},  email: %${req.user.email}%`, { color: 'cyan' });
    res.json({
      data: req.user,
      status: 200
    });
  };

  const loginFail = (err, req, res, next) => {
    if (err.status === 401) {
      err.message = 'Incorrect username or password';
      res.status(err.status).send({ errors: [err.message] });
    } else if (err.status === 400) {
      err.message = 'Password required';
      res.status(err.status).send({ errors: [err.message] });
    } else {
      throw new Error(`Login failure: ${err.status} ${err.message}`);
    }
  };

  const updateUser = (req, res) => {
    User.modelByField({ email: req.user.email })
      .then(user => {
        if (!user) {
          warn(`Authenticated user ${req.user.email} not found`);
          return res.json({ user:null });
        }
        return user.save(req.body);
      }).then(savedUser => {
        return res.json({
          status: 200,
          data: savedUser
        });
      });
  };

  const validateToken = (req, res) => {
    User.modelByField({ email: req.user.email })
      .then(user => {
        if (!user) {
          warn(`Authenticated user ${req.user.email} not found`);
          return res.json({ user:null });
        } else {
          info('User validated', user.cleanFields);
          return res.json({
            status: 200,
            data: user.cleanFields
          });
        }
      });
  };

  const showMe = (req, res) => {
    info('Me is ...', req.user);
    if (!req.user) {
      res.json({ user:null });
    } else {
      res.json({
        status: 200,
        user: req.user
      });
    }
  };

  const logOut = (req, res) => {
    User.modelById(req.user.id)
      .then(user => {
        info('Logging out, dont forget to save...', user);
        req.logOut();
        return res.json({ success: true });
      });
  };

  router.post('/register',
    passport.authenticate('local-signup', { failWithError: true, session: false }),
    registerUser,
    registerFail
  );

  router.post('/login',
    passport.authenticate('local-login', { failWithError: true, session: false }),
    loginUser,
    loginFail
  );

  router.post('/update',        passport.authenticate('jwt', { session: false }), updateUser);
  router.get('/validate_token', passport.authenticate('jwt', { session: false }), validateToken);
  router.get('/me',             passport.authenticate('jwt', { session: false }), showMe);
  router.all('/logout',         passport.authenticate('jwt', { session: false }), logOut);

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
}

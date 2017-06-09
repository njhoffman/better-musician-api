const router      = require('express').Router();
const createToken = require('jsonwebtoken').sign;
const config      = require('../../../config/project.config');

const { log } = require('debugger-256')('api:route:user');

export default function (passport, models) {
  const { User, Song, Field } = models;

  const registerUser = (req, res) => {
    const token = createToken(req.user, config.api_secret);
    log(`Registered user ${req.user.id}, token: ${token}`);
    req.user.uid = req.user.email;
    res.set('access-token', token);
    res.set('token-type', 'JWT');
    res.set('uid', req.user.uid);
    // app.set('expiry', 6666666);
    return Field.generate(4, { user: req.user.id })
      .then(results => {
        if (results.errors !== 0) {
          throw new Error(results.first_error);
        }
        return Song.generate(35, { user: req.user.id }, results.generated_keys);
      }).then(results => {
        if (results.errors !== 0) {
          throw new Error(results.first_error);
        }
        res.json({
          status: 200,
          data: req.user
        });
      });
  }

  const registerFail = (err, req, res, next) => {
    if (err.status === 401) {
      err.message = 'An account with that email is already registered';
      res.status(err.status).send({ errors: [err.message] });
    } else {
      throw new Error(err.message);
    }
  };

  const loginUser =  (req, res) => {
    const token = createToken(req.user, config.api_secret);
    log(`User logged in: ${req.user.id},  token: ${token}`);
    req.user.uid = req.user.email;
    res.set('access-token', token);
    res.set('token-type', 'JWT');
    res.set('uid', req.user.uid);
    // app.set('expiry', 6666666);
    res.json({
      data: req.user,
      status: 200
    });
  };

  const loginFail = (err, req, res, next) => {
    if (err.status === 401) {
      err.message = 'Incorrect username or password';
      res.status(err.status).send({ errors: [err.message] });
    } else {
      log(err.stack);
      throw new Error(err.message);
    }
  };

  const updateUser = (req, res) => {
    User.modelByField({ email: req.user.email })
      .then(user => {
        if (!user) {
          return res.json({ user:null });
        } else if (req.body) {
          return user.save(req.body);
        }
        return res.json({
          status: 200,
          data: user.fields
        });
      }).then(savedUser => {
        return res.json({
          status: 200,
          data: savedUser.fields
        });
      });
  };

  const validateToken = (req, res) => {
    log(`User logged in`, req.user);
    User.modelByField({ email: req.user.email })
      .then(user => {
        log('User validated', user);
        if (!user) {
          return res.json({ user:null });
        } else {
          return res.json({ status: 200, data: user.fields });
        }
      });
  };

  const showMe = (req, res) => {
    log('Me is ...', req.user);
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
        log('Logging out, dont forget to save...', user);
        req.logout();
        res.json({ status: 200, data: user.fields });
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

  router.post('/update', passport.authenticate('jwt', { session: false }), updateUser);
  router.get('/validate_token', passport.authenticate('jwt', { session: false }), validateToken);
  router.get('/me', passport.authenticate('jwt', { session: false }), showMe);
  router.all('/logout', passport.authenticate('jwt', { session: false }), logOut);

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

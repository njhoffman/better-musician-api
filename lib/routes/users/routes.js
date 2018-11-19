const _ = require('lodash');
const router = require('express').Router();
const createToken = require('jsonwebtoken').sign;
const { getConfig } = require('config/project.config');

const {
  InvalidRequestParams,
  LoginFailedAuth,
  TokenValidationNoUser
} = require('lib/ErrorTypes');

const { seedNewUser } = require('./lib');

let reqLogger;
const UserRoutes = (passport, respondSuccess, respondError) => {
  const handleRoute =  (req, res, next) => {
    reqLogger = req.logger.child({ subsystem: 'routes:users' });
    reqLogger.debug('attempting JWT authentication');
    passport.authenticate('jwt', { failWithError: true, session: false })(req, res, next);
  };

  const setupAuth = (req, res) => {
    reqLogger = req.logger.child({ subsystem: 'routes:users' });
    const { API_SECRET } = getConfig();
    const token = createToken(req.user, API_SECRET);
    req.user.uid = req.user.id;

    reqLogger.debug({ _trace: req.user }, `Setting up auth headers for ${req.user.email}`);

    res.set({
      'access-token' : token,
      'token-type' : 'JWT',
      uid : req.user.uid
    });
    // app.set('expiry', 6666666);
  };

  const registerSuccess = (req, res, next) => {
    const { User, Song, Field } = req._models_;
    setupAuth(req, res);
    reqLogger.info(`Registered user ${req.user.id}, email: ${req.user.email}`);
    return seedNewUser(req.user.email, 0, { User, Song, Field })
      .then(results => respondSuccess('create', { records: results })(req, res))
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
    } else {
      throw new Error(`Registration failure: ${status} ${msg}`);
    }
  };

  const loginSuccess =  (req, res, next) => {
    setupAuth(req, res);
    return respondSuccess('query', { records: req.user })(req, res);
  };

  const loginFail = (err, req, res, next) => {
    if (err.status === 401) {
      respondError(LoginFailedAuth('Incorrect username or password'))(req, res, next);
    } else if (err.status === 400) {
      respondError(InvalidRequestParams('Password required for login'))(req, res, next);
    } else {
      next(err);
    }
  };

  const seedUser = (req, res, next) => {
    // TODO: get rid of this!
    const { User, Song, Field } = req._models_;
    const { params: { email = 'testuser@example.com', num = 0 } } = req;
    seedNewUser(email, num, { User, Song, Field })
      .then(data => respondSuccess('create', data)(req, res))
      .catch(next);
  };

  const updateUser = (req, res, next) => {
    const { User } = req._models_;
    // TODO: this should be handled by baseModel when save invoked as a static method

    return User.save({ ...req.body, id: req.user.id })
      .then(data => respondSuccess('update', data)(req, res))
      .catch(next);
  };

  const validateToken = (req, res, next) => {
    const { User } = req._models_;
    User.modelByField({ email: req.user.email })
      .then(user => {
        if (!user) {
          respondError(
            TokenValidationNoUser(`Authenticated user ${req.user.email} not found`)
          )(req, res, next);
        } else {
          respondSuccess('query', { records: user.cleanFields })(req, res);
        }
      })
      .catch(next);
  };

  const showMe = (req, res, next) => {
    reqLogger.info({ _trace: req.user }, `Me is ${_.get(req, 'user.email') || '-- unauthenticated!'}`);
    return respondSuccess('query', { records: req.user })(req, res, next);
  };

  const logOut = (req, res, next) => {
    const { User } = req._models_;
    // const reqUserKeys = ['_requestId', '_requestIp', '_requestLocation', '_requestUser', '_requestUserAgent'];
    // const reqFields = req.logger.parent.fields;
    // const requestParams = _.pick(reqFields, reqUserKeys);

    User.modelById(req.user.id)
      .then(({ cleanFields }) => {
        reqLogger.info(`Logging out: ${cleanFields.email}`);
        req.logOut();
        return respondSuccess('update', cleanFields)(req, res);
        // TODO: saveEvent
        // return user.saveEvent('logout', requestParams);
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

  router.post('/update',           handleRoute, updateUser);
  router.get('/seed/:email?/:num', handleRoute, seedUser);
  router.get('/validate_token',    handleRoute, validateToken);
  router.get('/me',                handleRoute, showMe);
  router.all('/logout',            handleRoute, logOut);

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

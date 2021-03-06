const _ = require('lodash');

// auth strategies return success to first defined route if done is passed truthy value in 2nd parameter
//   -expects 2nd parameter success value to be an object to be assigned to req.user
//   -will return error to 2nd defined route

const jwtStrategy = (req, payload, done) => {
  const ReqModels = req._models_;
  const { User } = ReqModels;
  if (!_.has(payload, 'id')) {
    req.logger.warn({ payload }, 'JWT authentication failure: missing payload.id');
    return done(null, false);
  }
  return User.findById(payload.id)
    .then(fields => {
      if (_.isObject(fields)) {
        req._metadata_ = {
          ...req._metadata_,
          userId:    fields.id,
          userEmail: fields.email,
          userRoles: fields.roles
        };

        req.logger = req.logger.child({ _requestUser: fields.email, subsystem: 'passport:strategies' });
        req.logger.info({ _debug: { id: payload.id } },
          `JWT authentication success for user: ${fields.email}`);

        // TODO: put in utils
        Object.keys(ReqModels).forEach(modelKey => {
          ReqModels[modelKey].request = req._metadata_;
        });
        return done(null, fields);
      }
      req.logger.warn(`JWT authentication failed, account for id:${payload.id} not found`);
      return done(null);
    });
};

const loginStrategy = (req, email, password, done) => {
  // TODO: switch this to findModelByField
  const ReqModels = req._models_;
  const { User } = ReqModels;
  const { debug, info } = req.logger.child({ subsystem: 'passport:strategies' });

  User.modelByField({ email })
    .then(foundUser => {
      if (foundUser.length === 0) {
        debug(`No found user: ${email}`);
        return done(null, false);
      }

      info(
        { _trace: { userFields: foundUser.fields } },
        `Login attempt - found user ${email}, trying password: ${password}`
      );

      if (!foundUser.validPassword(password)) {
        info(`Invalid password: ${password}`);
        // TODO: save event
        // return foundUser.saveEvent('login_failure', requestParams);
        return done(null, false);
      }

      req._metadata_ = {
        ...req._metadata_,
        userId:     foundUser.fields.id,
        userEmail: foundUser.fields.email,
        userRoles: foundUser.fields.roles
      };

      // TODO: put in utils
      Object.keys(ReqModels).forEach(modelKey => {
        ReqModels[modelKey].request = req._metadata_;
      });

      req.logger = req.logger.child({ _requestUser: email, subsystem: 'passport:strategies' });
      req.logger.info({ _debug: foundUser.fields }, `Login authentication success for user: ${email}`);
      return done(null, foundUser._fields);
      // TODO: save event
      // return foundUser.saveEvent('login_success', requestParams);
    });
};

const signupStrategy = (req, email, password, done) => {
  // TODO: refactor this
  const { User } = req._models_;
  const { info } = req.logger.child({ subsystem: 'passport:strategies' });
  User.modelByField({ email })
    .then(existingUser => {
      if (existingUser.length !== 0) {
        info(`local signup failed for: ${email}, email already exists`);
        return done(null, false);
      }
      info(`local signup successful: ${email}`);
      return User.save({ email, password: User.generateHash(password) });
    })
    .then((results = {}) => {
      const { records } = results;
      return done(null, records);
    });
};

module.exports = {
  jwtStrategy,
  loginStrategy,
  signupStrategy
};

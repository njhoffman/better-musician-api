const uuid = require('uuid');
const _ = require('lodash');
const bunyan = require('bunyan');
const { serializers } = require('./logger.utils');

let loggerInstance;

const logConfig = {
  streams: [{
    stream: process.stdout,
    level: 'trace'
  }],
  serializers: bunyan.stdSerializers
};

const getOptions = () => {
  const defaultName = process.env.PWD ? process.env.PWD.split('/').pop() : 'app';
  const { NODE_APP_NAME, NODE_APP_NS, NODE_SUPPRESS_LOGS } = process.env;
  const name = NODE_APP_NS
    || global.__APP_NS__
    || NODE_APP_NAME
    || global.__APP_NAME__
    || defaultName;

  const suppressLogs = NODE_SUPPRESS_LOGS
    || global.__SUPPRESS_LOGS__
    || false;

  return { name, suppressLogs };
};

const preprocess = (log, level, ...message) => {
  // add global properties

  const msg = _.cloneDeep(message);
  if (_.isObjectLike(msg[0])) {
    msg[0]._logId = uuid.v4();
  } else {
    msg.unshift({
      _logId: uuid.v4()
    });
  }

  // add property to indicate to log viewer what level to filter object
  const logLevels = {
    silly : 7,
    trace : 6,
    debug : 5,
    info  : 4,
    warn  : 3,
    error : 2,
    fatal : 1
  };

  _.keys(logLevels).forEach(key => {
    if (_.has(msg[0], `_${key}`)) {
      const msgObj = _.cloneDeep(msg[0][`_${key}`]);
      msgObj._log_level = logLevels[key];
      _.merge(msg[0], msgObj);
      delete msg[0][`_${key}`];
    }
  });

  // apply serializers
  if (_.isObjectLike(msg[0])) {
    _.each(_.keys(msg[0]), (key) => {
      if (_.has(serializers, key)) {
        const obj = _.cloneDeep(msg[0][key]);
        _.merge(msg[0], serializers[key](obj));
      }
    });
  }

  if (!getOptions().suppressLogs) {
    log[level](...msg);
  }
};

const timers = {};
const timerStart = (name, desc) => {
  if (!name) {
    loggerInstance.warn('need to initialize timer with a name/id');
    return;
  }
  timers[name] = { desc: desc || name, start: new Date().getTime() };
};

const timerShow = (name) => {
  if (!_.has(timers, name)) {
    loggerInstance.warn(`timer: ${name} not found`);
    return;
  }
  let fmtTime = new Date().getTime() - timers[name].start;
  fmtTime = fmtTime > 1000 ? `${(fmtTime / 1000).toFixed(1)}s` : `${fmtTime}ms`;
  loggerInstance.info({ color: 'logTimer' }, `%${name}: ${fmtTime}%`);
};

const timerEnd = (name) => {
  timerShow(name);
  delete timers[name];
};

const createInstance = (log) => ({
  _dbg:    preprocess.bind(undefined, log, 'fatal'),
  silly:   preprocess.bind(undefined, log, 'silly'),
  trace:   preprocess.bind(undefined, log, 'trace'),
  debug:   preprocess.bind(undefined, log, 'debug'),
  info:    preprocess.bind(undefined, log, 'info'),
  warn:    preprocess.bind(undefined, log, 'warn'),
  error:   preprocess.bind(undefined, log, 'error'),
  fatal:   preprocess.bind(undefined, log, 'fatal'),
  streams: log.streams,
  parent:  log,
  timerStart,
  timerEnd,
  timerShow
});

const createLogger = (initName, childParams, extra) => {
  const name = initName || getOptions().name;
  const instanceConfig = { ...logConfig, name };
  const logParent = bunyan.createLogger(instanceConfig).child(childParams);
  const instance = createInstance(logParent);
  // instance.child = (args) => logger(args.subsystem, _.merge(extra, args));
  instance.child = (args) => {
    const child = createInstance(_.merge(extra, args));
    return child;
  };
  return instance;
};

const logger = (subsystem, extra = {}) => {
  const { name } = getOptions();
  const childParams = _.merge(extra, { subsystem });

  if (loggerInstance) {
    loggerInstance = createInstance(loggerInstance.parent.child(childParams));
    loggerInstance.child = (args) => logger(args.subsystem || subsystem, _.merge(extra, args));
    return loggerInstance;
  }

  loggerInstance = createLogger(name, childParams, extra);
  loggerInstance.child = (args) => logger(args.subsystem || subsystem, _.merge(extra, args));
  loggerInstance.debug(
    { ...(_.omit(extra, 'subsystem')) },
    `loaded logger configuration for ${name} (${subsystem})`
  );
  return loggerInstance;
};

// returns singleton if set, else returns new instance and setings singleton
module.exports = logger;

// returns new instance and does not set singleton
module.exports.initLogger = (name) => (subsystem, extra) => createLogger(name, { subsystem }, extra);

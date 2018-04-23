const bunyan = require('bunyan');
const uuid = require('uuid');
const _ = require('lodash');
const { serializers } = require('./logger.utils');

let loggerInstance, logParent;

const isTestEnv = process.env.NODE_ENV === 'test';
const logName = process.env['_APP_NAME_'] ? process.env['_APP_NAME_'] : 'instrumental-api';
const logConfig = {
  name: logName,
  streams: [{
    stream: process.stdout,
    level: 'trace'
  }],
  serializers: bunyan.stdSerializers
};

const preprocess = (log, level, ...message) => {
  // add global properties

  const msg = _.cloneDeep(message);
  const logId = uuid.v4();
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

  if (!isTestEnv) {
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

const timerEnd = (name) => {
  timerShow(name);
  delete timers[name];
};


const timerShow = (name) => {
  if (! _.has(timers, name)) {
    loggerInstance.warn(`timer: ${name} not found`);
    return;
  }
  let fmtTime = new Date().getTime() - timers[name].start;
  fmtTime = fmtTime > 1000 ? `${(fmtTime / 1000).toFixed(1)}s` : `${fmtTime}ms`;
  loggerInstance.info({ color: 'logTimer' }, `%${name}: ${fmtTime}%`);
};

const createInstance = (log) => {
  return {
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
  };
};

const logger = (subsystem, extra = {}) => {
  const childParams = _.merge(extra, { subsystem });
  if (loggerInstance) {
    loggerInstance = createInstance(loggerInstance.parent.child(childParams));
    // loggerInstance.child = (args) => logger(config, args.subsystem || subsystem, _.merge(extra, args));
    loggerInstance.child = (args) => logger(args.subsystem || subsystem, _.merge(extra, args));
    return loggerInstance;
  }
  //
  // if (config && config.logging) {
  //   if (config.logging.level) {
  //     logConfig.streams[0].level = config.logging.level;
  //   }
  //   if (config.logging.file && config.logging.file.path) {
  //     logConfig.streams.push(config.logging.file);
  //   }
  // }

  // TODO: fork bunyan and handle this in there
  logParent = bunyan.createLogger(logConfig).child(childParams);
  loggerInstance = createInstance(logParent);
  // loggerInstance.child = (args) => logger(config, args.subsystem || subsystem, _.merge(extra, args));
  loggerInstance.child = (args) => logger(args.subsystem || subsystem, _.merge(extra, args));

  // if (config && config.logging) {
  //   loggerInstance.debug({ data: config.logging }, 'loaded logger configuration');
  // }
  return loggerInstance;
};

module.exports = logger;
module.exports.init = (ss) => logger(ss);

const StatsD = require('node-statsd');
const { AuthLockError } = require('lib/Errors');

const sdc = new StatsD();
const { fatal, error, warn, info } = require('./logger')('api:error');

const colorStack = (stack) => {
  stack.split('\n').forEach((line, idx) => {
    if (line.indexOf('node_modules') === -1 && line.indexOf('better-musician-api') !== -1) {
      error({ color: 'bold' }, `%${line}%`);
    } else if (idx !== 0) {
      error({ color: 'gray' }, `%${line}%`);
    }
  });
};

const generalError = (description) => (err) => {
  switch (err.name) {
    // case "ReqlOpFailedError"
    case 'ReqlDriverError':
      err.message.split('\n').forEach(msg => {
        fatal(`Rethink DB Connection Error: ${msg}`);
        fatal(err);
      });
      break;
    default:
      error(`APP ERROR - ${err.name}: ${err.message}`);
      colorStack(err.stack);
      break;
  }
};

const routeError = (err, req, res, next) => {
  // syntax errors => ReferenceError
  if (!(err instanceof Error)) {
    // warn(`%*** INVALID ERROR HANDLING ***%`, { color: 'warn' });
    warn('A non-error was caught by the route error handler');
    warn({ err });
    // warn(`%*** INVALID ERROR HANDLING ***%`, { color: 'warn' });
  } else if (err.name === 'AuthenticationError') {
    warn(`Authentication error trying to reach: ${req.url}`);
  } else if (err instanceof AuthLockError) {
    warn(`${err.name}: ${err.message}`);
  } else {
    error(`A routing error was encountered trying to access: ${req.url}`);
    error({ color: 'bold' }, `\t%${err.name}:% ${err.message}`);
    colorStack(err.stack);
    sdc.increment('api_error');
    // error({ err });
  }

  if (!res.headersSent) {
    const status = err.status || 500;
    info(`Sending headers from error handler with status ${status}`);
    res.status(status).json({
      error: {
        message: err.message,
        status: err.status,
        name: err.name
      }
    });
  }
};

const isTest = global.__TEST__ || process.env.NODE_ENV === 'test';
if (!isTest) {
  // redundant handlers will be attached when test reloading with watch
  process.on('uncaughtException', generalError('An uncaught exception occured.'));
  process.on('unhandledRejection', generalError('An unhandled rejection occured.'));
}

module.exports = { generalError, routeError };

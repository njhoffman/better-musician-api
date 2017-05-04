const StatsD = require('node-statsd');
const sdc = new StatsD();

const { fatal, error, warn } = require('debugger-256')('api:error');

const colorStack = (stack) => {
  stack.split('\n').forEach((line, idx) => {
    if (line.indexOf('node_modules') === -1 && line.indexOf('instrumental-api') !== -1) {
      error(`%${line}%`, { color: 'red' });
    } else if (idx !== 0) {
      error(`%${line}%`, { color: 'gray' });
    }
  });
};

export const generalError = (description) => (err) => {
  error(`%*** ERROR ***%`, { color: 'red' });
  error(description);
  switch(err.name) {
    // case "ReqlOpFailedError"
    case 'ReqlDriverError':
      err.message.split('\n').forEach(msg => {
        fatal(`Rethink DB Connection Error: ${msg}`);
      });
      break;
    default:
      err.message.split('\n').forEach(msg => {
        error(`${err.name}: ${msg}`);
      });
      err.stack && colorStack(err.stack);
      break;
  }
  error(`%*** ERROR ***%`, { color: 'red' });
};

export const routeError = (err, req, res, next) => {
  // syntax errors => ReferenceError
  //
  if (! err instanceof Error) {
    warn(`%*** INVALID ERROR HANDLING ***%`, { color: 'warn' });
    warn('A non-error was caught by the route error handler');
    warn(err);
    warn(`%*** INVALID ERROR HANDLING ***%`, { color: 'warn' });
  } else {
    if (err.name === 'AuthenticationError') {
      warn(`Authentication error trying to reach: ${req.url}`);
    } else {
      error(`%*** ERROR ***%`, { color: 'red' });
      error(`A routing error was encountered trying to access: ${req.url}`);
      error(`\t%${err.name}:% ${err.message}`, { color: 'bold' });
      err.stack && colorStack(err.stack);
      error(`%*** ERROR ***%`, { color: 'red' });
      sdc.increment('api_error');
    }
  }
  if (!res.headersSent) {
    res.status(err.status ? err.status : 500).send(err.message);
  }
};

process.on('uncaughtException', generalError('An uncaught exception occured.'));
process.on('unhandledRejection', generalError('An unhandled rejection occured.'));

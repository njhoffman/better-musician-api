const chalk = require("chalk");
const util = require("util");
const _ = require('lodash');
const configDebug = require('debugger-256');

const verbosity = 9;

function padLeft(str, len) {
  return len > str.length
    ? (new Array(len - str.length + 1)).join(' ') + str
    : str
}
function padRight(str, len) {
  return len > str.length
    ? str + (new Array(len - str.length + 1)).join(' ')
    : str
}

function isJson(str) {
  try {
    JSON.parse(str);
  } catch(e) {
    return false;
  }
  return true;
}

const requestDebug  = configDebug('api:request');
const requestOutput = (req, res, next) => {
  const { log, info, trace } = requestDebug;
  const method = ">>> " + req.method;
  const methodColor = (method === 'POST' || method === 'PUT')
    ? 'blue' : method === 'DELETE'
    ? 'red' : 'green';

  const url = req.path;
  const body = req.body || {};
  const query = req.body || {};

  log(padRight(chalk[methodColor](method) + ' ' + url, 50));

  trace('Headers', _.omit(req.headers, 'cookie'));
  if (req.session) {
    trace('Session', req.sesion);
  }
  trace('Cookies', req.cookies);

  if (res.locals && Object.keys(res.locals).length > 0) {
    trace("Locals ", res.locals);
  }
  if (Object.keys(body).length > 0) {
    if (isJson(body)) { info('Body', JSON.parse(body)); }
    else { info('Body', body); }
  }
  if (Object.keys(query).length > 0) { info("Query", query); }
  if (next) { next(); }
};

const responseOutput = function(debug) {
  return function (req, res) {

    let body = [];
    res.on('data', function(chunk) {
      body += chunk;
      if (isJson(body)) {
        debug(bodyJson);
      }
    });
    const status = res.statusCode;
    const statusColor = status >= 500
        ? 'red' : status >= 400
        ? 'yellow' : status >= 300
        ? 'cyan' : 'green'
    const method = "<<< " + req.method
    const methodColor = (method === 'POST' || method === 'PUT')
      ? 'blue' : method === 'DELETE'
      ? 'red' : 'green';


    const contentLength =  res['_contentLength'] ? res['_contentLength'] + ' Bytes' : '-';
    const responseTime = "";
    const url = req.path;

    debug(chalk.reset(padRight(chalk[methodColor](method) + ' ' + url, 50))
        + ' ' + chalk[statusColor](status)
        + ' ' + chalk.reset(padLeft(responseTime + ' ms', 8))
        + ' ' + chalk.reset('-')
      + ' ' + chalk.reset(contentLength));

    debug('Headers', _.omit((res.headers ? res.headers : req.headers), 'cookie') );
    if (req.session) {
      debug('Session', req.session);
    }
    if (req.cookies && Object.keys(req.cookies).length > 0) {
      debug('Cookies', res.cookies);
    }
    if (res.locals && Object.keys(res.locals).length > 0) {
      debug("Locals", res.locals);
    }
  }
};

const responseDebug = configDebug('api:response');
const morganOutput = (tokens, req, res, next) => {
  const { log, info, trace } = responseDebug;

  let body = [];
  res.on('data', function(chunk) {
    body += chunk;
    if (isJson(body)) {
      info(bodyJson);
    }
  });

  const status = tokens.status(req, res)
  const statusColor = status >= 500
      ? 'red' : status >= 400
      ? 'yellow' : status >= 300
      ? 'cyan' : 'green'
  const method = "<<< " + tokens.method(req, res);
  const methodColor = (method === 'POST' || method === 'PUT')
    ? 'blue' : method === 'DELETE'
    ? 'red' : 'green';


  const contentLength =  res['_contentLength'] ? res['_contentLength'] + ' Bytes' : '-';
  const responseTime = tokens['response-time'](req, res);
  const url = req.path;

  log(chalk.reset(padRight(chalk[methodColor](method) + ' ' + url, 50))
      + ' ' + chalk[statusColor](status)
      + ' ' + chalk.reset(padLeft(responseTime + ' ms', 8))
      + ' ' + chalk.reset('-')
    + ' ' + chalk.reset(contentLength));
  trace('Headers', _.omit((res.headers ? res.headers : req.headers), 'cookie') );
  if (req.session) { trace('Session', req.session); }
  if (res.locals && Object.keys(res.locals).length > 0) { trace(res.locals); }
};

const webpackLog = (debug) => (message) => {
  if (typeof debug === 'undefined') {
    const debug = require("debug")("app:server:webpack");
  }
  if (message.indexOf('\n') !== -1) {
    return console.log("\n\n", message, "\n\n");
  }
  return debug(message);
};

module.exports = {
  responseOutput,
  requestOutput,
  morganOutput,
  webpackLog

}


const { omit, isEmpty, isObject } = require('lodash');
const StatsD = require('node-statsd');
const configDebug = require('debugger-256');

const sdc = new StatsD();

const humanMemorySize = (bytes, si) => {
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  var units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
};

const padLeft = (str, len) => {
  return len > str.length
    ? (new Array(len - str.length + 1)).join(' ') + str
    : str;
};

const padRight = (str, len) => {
  return len > str.length
    ? str + (new Array(len - str.length + 1)).join(' ')
    : str;
};

const isJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const getMethodTag = (method) =>
  method === 'POST' || method === 'PUT' ? 'Post'
    : method === 'GET' ? 'Get'
    : method === 'DELETE' ? 'Delete'
    : 'Other';

const getStatusTag = (status) =>
  status >= 500
    ? 'Error' : status >= 400
    ? 'Warn' : status >= 300
    ? 'Info' : 'Ok';

const logBody = ({ info, debug, trace }, body) => {
  if (! isObject(body) && isJson(body)) {
    body = JSON.parse(body);
  }
  if (isObject(body) && Object.keys(body).length > 0) {
      info(`--Body Request: ${Object.keys(body).length} keys`, { filterMax: 4 });
      debug('--Body Request', body, { filterMax: 5, pjsonOptions: { depth: 3 } });
      trace('--Body Request', body);
  } else if (body && body.length > 0) {
      info('--Body (non-Json) Request', body);
  }
};

const requestDebug = configDebug('api:request');
const requestOutput = (req, res, next) => {
  const { log, info, trace } = requestDebug;
  const method = '>>> ' + req.method;
  const methodColorTag = 'request' + getMethodTag(req.method);
  const url = req.path;
  const body = req.body || {};
  const query = req.body || {};

  log(padRight('%' + method + '% %' + url + '%', 50),
    { color: methodColorTag },
    { color: 'requestUrl' });

  trace('Headers', omit(req.headers, 'cookie'));
  if (req.session) { trace('Session', req.sesion); }
  if (! isEmpty(req.cookies)) { trace('Cookies', req.cookies); }
  if (! isEmpty(req.locals)) { trace('Locals ', req.locals); }
  if (Object.keys(query).length > 0 && Object.keys(query).length !== Object.keys(body)) { info('Query', query); }

  logBody(requestDebug, body);
  sdc.increment('api_request');
  if (next) { next(); }
};

const responseDebug = configDebug('api:response');
const morganOutput = (tokens, req, res, next) => {
  const { log, info, trace } = responseDebug;

  let body = [];
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', (chunk) => {
    if (chunk) {
      body += chunk;
    }
    logBody(responseDebug, body);
  });

  const status = tokens.status(req, res);
  const statusColorTag = 'requestStatus' + getStatusTag(status);
  const method = '<<< ' + tokens.method(req, res);
  const methodColorTag = 'response' + getMethodTag(req.method);

  const contentLength = res['_contentLength'] ? res['_contentLength'] + ' Bytes' : '-';
  const responseTime = tokens['response-time'](req, res);
  const url = req.path;

  log(
    padRight('%' + method + '% %' + url, 50) + '%' +
    ' %' + status + '% ' +
    padLeft(responseTime + ' ms', 8) +
    ' - ' + contentLength,
    { color: methodColorTag },
    { color: 'requestUrl' },
    { color: statusColorTag }
  );
  trace('Headers', omit((res.headers ? res.headers : req.headers), 'cookie'));
  if (req.session) { trace('Session', req.session); }
  if (res.locals && Object.keys(res.locals).length > 0) { trace(res.locals); }
};

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
    // res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

module.exports = {
  requestOutput,
  morganOutput,
  allowCrossDomain
};

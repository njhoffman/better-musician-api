const url = require('url');
const { isObject } = require('lodash');
const uuid = require('uuid/v4');
const _ = require('lodash');
const StatsD = require('node-statsd');
const useragent = require('useragent');
const geoip = require('geoip-lite');
const initLogger = require('./logger');

const sdc = new StatsD();

const padLeft = (str, len) => (
  len > str.length
    ? (new Array(len - str.length + 1)).join(' ') + str
    : str
);

const padRight = (str, len) => (
  len > str.length
    ? str + (new Array(len - str.length + 1)).join(' ')
    : str
);

const isJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

// const getMethodTag = (method) => {
//   if (method === 'POST' || method === 'PUT') {
//     return 'Post';
//   } else if (method === 'GET') {
//     return 'Get';
//   } else if (method === 'DELETE') {
//     return 'Delete';
//   }
//   return 'Other';
// };

// const getStatusTag = (status) => {
//   if (status >= 500) {
//     return 'Error';
//   } else if (status >= 400) {
//     return 'Warn';
//   } else if (status >= 300) {
//     return 'Info';
//   }
//   return 'Ok';
// };

const logBody = ({ info, debug, trace }, data) => {
  let body = data;
  if (!isObject(data) && isJson(data)) {
    body = JSON.parse(data);
  }
  if (isObject(body) && Object.keys(body).length > 0) {
    // debug({ body }, '--Body Request', filterMax: 5, pjsonOptions: { depth: 3 } });
    debug({ body }, '  --');
  } else if (body && body.length > 0) {
    info({ body }, '  --Body (non-Json) Request');
  }
};

const requestLog = (req, res, next) => {
  const logger = initLogger('api:request');
  // other headers: content-length, accept, accept-encoding, cookie,
  const reqId = req.id || req.headers['X-Amx-Request-Id'] || uuid.v4();
  const method = req.method.toLowerCase();
  const pUrl = url.parse(req.url);
  const body = req.body || {};
  const reqObj = { method };

  if (req.params) reqObj.data = _.omit(req.params, ['0', '1']);
  if (req.session && req.session.user) reqObj.user = req.session.user;
  if (req.sessionID) reqObj.sessionId = req.sessionID;
  reqObj.sourceIp = (
    (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
      .split(',')
      .shift()
      .replace('::ffff:', '')
  );

  reqObj.userAgent = req['user-agent'];
  reqObj.url = `${pUrl.href.replace(pUrl.query, '').replace(pUrl.hash, '')}`;
  const geoLocation = geoip.lookup(reqObj.sourceIp);
  const { city = '', region = '', country = '' } = geoLocation || {};

  let locDesc = [
    `${city}${city.length > 0 ? ', ' : ''}`,
    `${region}${region.length > 0 ? ' ' : ''}`,
    `${country && country !== 'US' ? country : ''}`
  ].join('');

  if (/^192.168|^172|^10/.test(reqObj.sourceIp)) {
    locDesc = 'Reserved';
  }

  const agent = useragent.parse(req.headers['user-agent']);
  const userDesc = _.has(req, 'headers.uid') ? `${req.headers.uid}` : '';
  req.logger = logger.child({
    subsystem:         'api:request',
    _requestId:        reqId,
    _requestIp:        reqObj.sourceIp,
    _requestLocation:  locDesc.trim(),
    _requestUser:      userDesc,
    _requestStart:     new Date().getTime(),
    _responseTime:     req.headers['X-Response-Time'],
    _requestUserAgent: agent.toString()
  });

  const reqParams = ['url', 'headers', 'body', 'cookies', 'params'];
  if (reqObj.url === '/health') {
    req.logger.debug(`❤ ${reqObj.sourceIp}`);
  } else {
    req.logger.info(
      { _trace: { _request: _.pick(req, reqParams) } },
      `${req.method.toUpperCase()} - ${reqObj.url}`
    );
  }
  logBody(req.logger, body);
  sdc.increment('app_request');
  if (_.isFunction(next)) {
    next();
  }
};

const responseLog = (req, res, time) => {
  const logger = req._isProxy
    ? req.logger.child({ subsystem: 'app:proxy' })
    : req.logger.child({ subsystem: 'app:server' });

  const fmtTime = `${time.toFixed(2)}ms`;
  if (req.url === '/health') {
    logger.debug(`❤ ${req._requestIp}`);
  } else {
    // res.locals?
    // logger.info({ _response: { url: req.url, code: res.statusCode, time: fmtTime } },
    //   `Response to ${req.url}: ${res.statusCode} in ${fmtTime}`);
  }
  res.setHeader('X-Response-Time', fmtTime);
};

const morganOutput = (tokens, req, res, next) => {
  const { info, debug, trace } = initLogger('api:response');

  let body = [];
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', (chunk) => {
    if (chunk) {
      body += chunk;
    }
    logBody({ info, debug, trace }, body);
  });

  // const status = tokens.status(req, res);
  // const statusColorTag = 'requestStatus' + getStatusTag(status);
  // const method = `<<< ${tokens.method(req, res)}`;
  // const methodColorTag = 'response' + getMethodTag(req.method);

  // const contentLength = res['_contentLength']
  //   ? `${res['_contentLength']} Bytes`
  //   : '-';
  const responseTime = tokens['response-time'](req, res);

  const fmtTime = `${Number(responseTime).toFixed(2)}ms`;

  info({
    _response: { url: req.url, code: res.statusCode, time: fmtTime }
  }, `Response to ${req.url}: ${res.statusCode} in ${fmtTime}`);

  trace({ headers: res.headers || req.headers }, 'Headers');
  if (req.session) {
    trace({ session: req.session }, 'Session');
  }

  if (res.locals && Object.keys(res.locals).length > 0) {
    trace(res.locals);
  }
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
  padRight,
  padLeft,
  requestLog,
  responseLog,
  morganOutput,
  allowCrossDomain
};

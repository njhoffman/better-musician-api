const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const url = require('url');
const uuid = require('uuid/v4');
const useragent = require('useragent');
const geoip = require('geoip-lite');
const initLogger = require('lib/utils/logger');

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

const parseBody = (data) => {
  const result = { message: null, parsedBody: data };
  if (!_.isObject(data) && isJson(data)) {
    result.parsedBody = JSON.parse(data);
  }

  if (_.isObject(result.parsedBody) && _.keys(result.parsedBody).length > 0) {
    result.message = '  --body (JSON)';
  } else if (!_.isEmpty(data)) {
    result.message = '  --body (non-JSON)';
  }
  return result;
};

const initRequestMetadata = (req, res, next) => {
  // other headers: content-length, accept, accept-encoding, cookie,
  const reqId = req.id || req.headers['X-Amx-Request-Id'] || uuid.v4();
  const method = req.method.toLowerCase();
  const pUrl = url.parse(req.url);
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
  const geoLocation = geoip.lookup(reqObj.sourceIp) || {};
  const { city = '', region = '', country = '' } = geoLocation;

  let locDesc = [
    `${city}${city.length > 0 ? ', ' : ''}`,
    `${region}${region.length > 0 ? ' ' : ''}`,
    `${country && country !== 'US' ? country : ''}`
  ].join('');

  if (/^192.168|^172||127.0.0.1|^10/.test(reqObj.sourceIp)) {
    locDesc = 'RSV';
  }

  const agent = useragent.parse(req.headers['user-agent']);

  const _metadata_ = {
    requestIp: reqObj.sourceIp,
    requestId: reqId,
    location:  locDesc.trim(),
    start:     new Date().getTime(),
    time:      req.headers['X-Response-Time'],
    userAgent: agent.toString().replace('Other 0.0.0 / Other 0.0.0', '0/0'),
    urlPath:   reqObj.url,
    urlMethod: reqObj.method.toUpperCase()
  };

  req._metadata_ = {
    ..._metadata_,
    loggerFields: () => ({
      _requestId:        _metadata_.requestId,
      _requestIp:        _metadata_.requestIp,
      _requestLocation:  _metadata_.location,
      _requestUser:      _metadata_.userEmail,
      _requestStart:     _metadata_.start,
      _responseTime:     _metadata_.time,
      _requestUserAgent: _metadata_.userAgent,
      _requestUrl:       _metadata_.urlPath,
      _requestMethod:    _metadata_.urlMethod
    })
  };

  next();
};

const initModelMetadata = (models) => (req, res, next) => {
  const { _metadata_ }  = req;
  const reqModels = { ...models };
  Object.keys(models).forEach(modelKey => {
    reqModels[modelKey].request = _metadata_;
  });
  req._models_ = models;
  next();
};

const requestLog = (req, res, next) => {
  const logger = initLogger('request');
  const { urlPath, ip, urlMethod } = req._metadata_;
  // other headers: content-length, accept, accept-encoding, cookie,
  req.logger = logger.child({
    subsystem:         'request',
    ...req._metadata_.loggerFields()
  });

  const body = req.body || {};

  const reqParams = ['url', 'headers', 'body', 'cookies', 'params', 'method'];
  if (urlPath === '/health') {
    req.logger.debug(`❤ ${ip}`);
  } else {
    req.logger.info(
      { _trace: { _request: _.pick(req, reqParams) } },
      `${urlMethod} - ${urlPath}`
    );
  }
  const { message, parsedBody } = parseBody(body);
  if (message) {
    req.logger.debug({ parsedBody }, message);
  }
  next();
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

const morganOutput = (tokens, req, res, next) => {
  const logger =  req.logger.child({ subsystem: 'response' });
  let body = [];
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', (chunk) => {
    if (chunk) {
      body += chunk;
    }

    const { message, parsedBody } = parseBody(body);
    if (message) {
      logger.debug({ parsedBody }, message);
    }
  });

  const responseTime = tokens['response-time'](req, res);

  const fmtTime = `${Number(responseTime).toFixed(2)}ms`;

  logger.info({
    _response: { url: req.url, code: res.statusCode, time: fmtTime }
  }, `Response to ${req.url}: ${res.statusCode} in ${fmtTime}`);

  logger.trace({ headers: res.headers || req.headers }, 'Headers');
  if (req.session) {
    logger.trace({ session: req.session }, 'Session');
  }

  if (res.locals && Object.keys(res.locals).length > 0) {
    logger.trace(res.locals);
  }
};

const isDirectory = source => fs.lstatSync(source).isDirectory();

const getDirectories = source => fs.readdirSync(source)
  .map(name => path.join(source, name))
  .filter(isDirectory);


module.exports = {
  getDirectories,
  morganOutput,
  padRight,
  padLeft,
  initRequestMetadata,
  initModelMetadata,
  requestLog,
  allowCrossDomain
};

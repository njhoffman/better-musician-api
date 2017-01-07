const chalk = require("chalk");
const verbose = true;
const util = require("util");
const pjson = require('prettyjson-256');

const pjsonOptions = {
  colors:     {
    // keys:    { fg:  [1,3,2] },
    keys:    { fg:  [0,2,1] },
    number:  { grayscale: 11 }
  },
  alphKeys:   true,
  alphArrays: true
};


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

const outputHeaders = function(headers, ignore) {
  const ignoredFields = ['cookie'];
  let out = "";
  var maxLength = Object.keys(headers).reduce(function(a,b) {
    return a.length > b.length ? a : b;
  }).length;
  maxLength++;

  Object.keys(headers).forEach(function(headerKey, i) {
    if (ignoredFields.indexOf(headerKey) === -1) {
      out += (i > 0 ? "\n" : "")
        + chalk.gray("    " + headerKey + Array(maxLength - headerKey.length).join(' ')
        + " => " + headers[headerKey]);
    }
  });
  return out;
};

const outputSession = function(session, ignore) {
  let out = "";
    if (session && session.id) {
      const sessionId = session.id;
      let sessionMsg;
      Object.keys(session).forEach(function(sessionKey) {
        sessionMsg = "";
        Object.keys(session[sessionKey]).forEach(function(key) {
          sessionMsg += chalk.gray("        " + key + " => " + session[sessionKey][key] + "\n");
        });
        sessionMsg = chalk.gray("      " + sessionKey + "\n" + sessionMsg);
      });
      out += chalk.gray("    Session " + sessionId + "\n" + sessionMsg);
    }
  return out;
};

const outputCookies = function(cookies, ignore) {
  let out = chalk.gray("    Cookies\n");
    if (cookies) {
      Object.keys(cookies).forEach(function(cookieKey) {
        out += chalk.gray("      " + cookieKey + " => " + cookies[cookieKey] + "\n");
      });
    }
  return out;
};

const requestOutput = function(debug) {
  return function (req, res, next) {
    const method = ">>> " + req.method;
    const methodColor = (method === 'POST' || method === 'PUT')
      ? 'blue' : method === 'DELETE'
      ? 'red' : 'green';

    const url = req.path;
    const body = req.body || {};
    const query = req.body || {};

    debug(padRight(chalk[methodColor](method) + ' ' + url, 50));

    if (verbose) {
      debug(outputHeaders(req.headers));
      if (req.session) {
        debug(outputSession(req.sesion));
      }
      debug(outputCookies(req.cookies));

      if (res.locals && Object.keys(res.locals).length > 0) {
        debug("Locals %O", res.locals);
      }
    }
    if (Object.keys(body).length > 0) {
      if (isJson(body)) {
        const bodyJson = pjson.render(JSON.parse(body), pjsonOptions, 4);
        debug(bodyJson);
      } else {
        debug(body);
      }
    }
    if (Object.keys(query).length > 0) {
      debug("Query \n %O", query);
    }
    if (next) {
      next();
    }
  }
};

const responseOutput = function(debug) {
  return function (req, res) {

    let body = [];
    res.on('data', function(chunk) {
      body += chunk;
      if (isJson(body)) {
        const bodyJson = pjson.render(JSON.parse(body), pjsonOptions, 4);
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

    if (verbose) {
      debug(outputHeaders(res.headers ? res.headers : req.headers));
      debug(outputSession(req.session));
      if (req.cookies && Object.keys(req.cookies).length > 0) {
        debug(outputCookies(res.cookies));
      }
      if (res.locals && Object.keys(res.locals).length > 0) {
        debug("%O", res.locals);
      }
    }
  };
};

const morganOutput = function(debug) {
  return function (tokens, req, res) {
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

    debug(chalk.reset(padRight(chalk[methodColor](method) + ' ' + url, 50))
        + ' ' + chalk[statusColor](status)
        + ' ' + chalk.reset(padLeft(responseTime + ' ms', 8))
        + ' ' + chalk.reset('-')
      + ' ' + chalk.reset(contentLength));
    if (verbose) {
      debug(outputHeaders(res.headers ? res.headers : req.headers));
      debug(outputSession(req.session));
      if (res.locals && Object.keys(res.locals).length > 0) {
        debug("%O", res.locals);
      }
    }
  };
};

const webpackLog = function(message) {
  if (typeof webpackDebug === 'undefined') {
    webpackDebug = require("debug")("app:server:webpack");
  }
  if (message.indexOf('\n') !== -1) {
    return console.log("\n\n", message, "\n\n");
  }
  return webpackDebug(message);
};

module.exports.responseOutput = responseOutput;
module.exports.requestOutput = requestOutput;
module.exports.morganOutput = morganOutput;
module.exports.webpackLog = webpackLog

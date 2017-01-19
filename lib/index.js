import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import http from 'http';
import multer from 'multer';
import passport from 'passport';
import morgan from 'morgan';
import configPassport from './utils/passport';
import userRoutes from './routes/users';
import songRoutes from './routes/songs';
import fieldRoutes from './routes/fields';
import adminRoutes from './routes/admin';

// import SocketIo from 'socket.io';

import config from '../config/project.config';
import { requestOutput, morganOutput } from './utils/server.utils.js';
import { init as configDb } from './utils/db';

const debug             = require('debug')('api:');
const requestDebug      = require('debug')('api:request');
const responseDebug     = require('debug')('api:response');

const upload = multer();
const app = express();

debug("initializing api proxy server");
app.use(upload.array());
app.use(cookieParser('somesecret'));
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestOutput(requestDebug));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    // res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
}
app.use(allowCrossDomain);
app.use(passport.initialize());

const timeStart = Date.now()
configDb().then(database => {
  debug("configured database in " + ((Date.now() - timeStart) / 1000) + "s");

  // any response/header rewriting that happens after here won't get logged
  app.use(morgan(morganOutput(responseDebug)));


  app.use((req, res, next) => {
    if (req.headers['user-agent']
      && req.headers['user-agent'].indexOf('curl') !== -1) {
      req._isCurl = true;
    }
    next();
  });

  configPassport(passport);

  app.use('/users', userRoutes(passport));
  app.use('/songs', songRoutes(passport));
  app.use('/fields', fieldRoutes(passport));
  app.use('/admin', adminRoutes(passport));


  app.get('/api/test', (req, res) => {
    debug("testing");
    res.json( { status: 'ok' });
  });


  // error handler
  app.use(function (err, req, res, next) {
    debug("\n\n*** ERROR ***");
    console.error(err);
    debug("*** ERROR ***\n\n");
    if (!res.headersSent) {
      res.status(err.status ? err.status : 500).send(err.message)
    }
  });

  app._router.stack.forEach(function(r) {
    if (false && r.route && r.route.path) {
      debug("registered route %o %s", r.route.methods, r.route.path);
    }
  });
  app.listen(config.api_port, (err) => {
    if (err) {
      debug(err);
    }
    debug('API is running on port %s', config.api_port);
    debug('Send requests to http://%s:%s', config.api_host, config.api_port);
  });

});


/*
  *
  * HU: Disabling socket.io server for now
  *
const server = new http.Server(app);
const io = new SocketIo(server);
io.path('/ws');
const bufferSize = 100;
const messageBuffer = new Array(bufferSize);
let messageIndex = 0;

io.on('connection', (socket) => {
  socket.emit('news', {msg: `'Hello World!' from server`});

  socket.on('history', () => {
    for (let index = 0; index < bufferSize; index++) {
      const msgNo = (messageIndex + index) % bufferSize;
      const msg = messageBuffer[msgNo];
      if (msg) {
        socket.emit('msg', msg);
      }
    }
  });

  socket.on('msg', (data) => {
    data.id = messageIndex;
    messageBuffer[messageIndex % bufferSize] = data;
    messageIndex++;
    io.emit('msg', data);
  });
});
io.listen(runnable);
*/


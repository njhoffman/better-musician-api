import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import passport from 'passport';
import morgan from 'morgan';
import StatsD from 'node-statsd';
import configPassport from './utils/passport';
import userRoutes from './routes/users';
import songRoutes from './routes/songs';
import fieldRoutes from './routes/fields';
import adminRoutes from './routes/admin';
import chalk from 'chalk';

// import SocketIo from 'socket.io';

import config from '../config/project.config';
import { requestOutput, morganOutput } from './utils/server.utils.js';
import { init as configDb } from './utils/db';

const { fatal, error, log, info, trace } = require('debugger-256')('api:main');
const sdc = new StatsD();
const app = express();

log('initializing api proxy server');
sdc.increment('api_start');

process.on('uncaughtException', (err) => {
  sdc.increment('app_uncaught_exception');
  error('\n\n');
  error('*** UNCAUGHT EXCEPTION ***');
  console.error(err);
  error('*** UNCAUGHT EXCEPTION ***');
  error('\n\n');
});

process.on('unhandledRejection', (err) => {
  sdc.increment('app_unhandled_rejection');
  error('\n\n');
  error('*** UNHANDLED REJECTION ***');
  console.error(err);
  error('*** UNHANDLED REJECTION ***');
  error('\n\n');
});

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
    // res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
};

const initMiddleware = (app) => {
  app.use(multer().array());
  app.use(cookieParser('somesecret'));
  app.use(bodyParser.json({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(requestOutput);
  app.use(allowCrossDomain);
  app.use(passport.initialize());
  // any response/header rewriting that happens after here won't get logged
  app.use(morgan(morganOutput));
  return Promise.resolve(app);
};

const initRouting = (app) => {
  app.use((req, res, next) => {
    if (req.headers['user-agent'] &&
      req.headers['user-agent'].indexOf('curl') !== -1) {
      req._isCurl = true;
    }
    sdc.increment('api_request');
    next();
  });

  configPassport(passport);

  app.use('/users', userRoutes(passport));
  app.use('/songs', songRoutes(passport));
  app.use('/fields', fieldRoutes(passport));
  app.use('/admin', adminRoutes(passport));

  app.get('/api/test', (req, res) => {
    log('testing');
    res.json({ status: 'ok' });
  });

  // error handler
  app.use(function (err, req, res, next) {
    error('\n\n' + chalk.red(`*** ERROR ***\n\n`));
    err.stack.split('\n').forEach((line, idx) => {
      if (line.indexOf('node_modules') === -1) {
        error(chalk.red(line));
      }
      if (idx !== 0) {
        error(chalk.gray(line));
      }
    });
    error('\n\n' + chalk.red('*** ERROR ***\n\n'));
    sdc.increment('api_error');
    if (!res.headersSent) {
      res.status(err.status ? err.status : 500).send(err.message);
    }
  });
};

const timeStart = Date.now();
initMiddleware(app).then(app => {
  return configDb();
}).then(database => {
  log('configured database in ' + ((Date.now() - timeStart) / 1000) + 's');
  return initRouting(app);
}).then(() => {
  app.listen(config.api_port, (err) => {
    if (err) {
      error(err);
    }
    log(`API is running on port: ${config.api_port}`);
    log(`Send requests to http://${config.api_host}:${config.api_port}`);
  });
}).catch((ReqlDriverError) => {
  ReqlDriverError.message.split('\n').forEach(msg => {
    fatal(`Rethink DB Connection Error: ${msg}`);
  });
}).catch(err => {
  log('NO YOU ARE NOT');
  log(err);
});

/*
  *
  * HU: Disabling socket.io server for now
  *
import http from 'http';
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

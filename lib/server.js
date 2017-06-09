import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import passport from 'passport';
import morgan from 'morgan';
import StatsD from 'node-statsd';
import createDebug from 'debugger-256';
// import SocketIo from 'socket.io';

import { version } from '../package.json';
import { routeError, generalError } from './utils/error';
import config from '../config/project.config';
import configPassport from './utils/passport';
import userRoutes from './routes/users';
import songRoutes from './routes/songs';
import fieldRoutes from './routes/fields';
import adminRoutes from './routes/admin';

import {
  requestOutput,
  morganOutput,
  allowCrossDomain
} from './utils/server.utils.js';

import {
  init as configDb,
  start as startDb
} from './utils/db';

const { fatal, error, warn, log, info, debug, trace } = createDebug('api:main');
const sdc = new StatsD();

const initMiddleware = (app) => {
  app.use(multer().array());
  app.use(cookieParser('somesecret'));
  app.use(bodyParser.json({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(requestOutput);
  app.use(allowCrossDomain);
  app.use(passport.initialize());
  return Promise.resolve(app);
};

const initRouting = (app, models) => {
  app.use((req, res, next) => {
    if (req.headers['user-agent'] &&
      req.headers['user-agent'].indexOf('curl') !== -1) {
      req._isCurl = true;
    }
    sdc.increment('api_request');
    next();
  });

  // any response/header rewriting that happens after here won't get logged
  app.use(morgan(morganOutput));

  configPassport(passport);

  app.use('/version', (req, res) => {
    res.send({
      version
    });
  });
  app.use('/users', userRoutes(passport, models));
  app.use('/songs', songRoutes(passport, models));
  app.use('/fields', fieldRoutes(passport, models));
  app.use('/admin', adminRoutes(passport, models));

  // route error handler, must be last
  app.use(routeError);
};

info('Initializing API Proxy Server');


export const initServer = () => {
  const timeStart = Date.now();
  const app = express();
  sdc.increment('api_start');
  return initMiddleware(app).then(app => {
    return configDb();
  }).then(models => {
    log('Configured Database in ' + ((Date.now() - timeStart) / 1000) + 's');
    return initRouting(app, models);
  }).then(() => {
    return new Promise((resolve, reject) => {
      if (__TEST__) {
        // supertest assigns ephemeral ports
        return resolve(app);
      }
      app.listen(config.api_port, (err) => {
        if (err) {
          generalError(`Error trying to listen to port ${config.api_port}`)(err);
          reject(err);
        }
        log(`API is running on port: %${config.api_port}%`, { color: 'cyan' });
        log(`Send requests to %http://${config.api_host}:${config.api_port}%`, { color: 'bold' });
        resolve(app);
      });
    });
  }).catch(generalError('An error occured during app initialization.'));
};

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

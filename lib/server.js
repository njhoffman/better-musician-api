global.__APP_NAME__ = 'instrumental-api';

const express = require('express');
const StatsD = require('node-statsd');
// const SocketIo = require('socket.io');

const { info, debug, error } = require('./utils/logger')('api:server');
const { initConfig } = require('../config/project.config');

// helper functions to ensure configuration is applied before loading
const initRouting = require('./router');
const initMiddleware = require('./middleware');
const configDb = require('./utils/db').initDb;

const sdc = new StatsD();

const startServer = (app, config) => (
  new Promise((resolve, reject) => {
    // supertest assigns ephemeral ports
    if (__TEST__) {
      return resolve(app);
    }

    return app.listen(config.api_port, (err) => {
      if (err) { reject(err); }
      info({ color: 'bold' }, `API is running on port: %${config.api_port}%`);
      resolve(app);
    });
  })
);

const initComponents = (config) => {
  const app = express();
  return initMiddleware(app)
    .then(() => configDb(config))
    .then(models => initRouting(app, models))
    .then(() => startServer(app, config));
};

const initServer = () => {
  debug('Initializing API Proxy Server');
  sdc.increment('api_start');
  return initConfig()
    .then(config => initComponents(config))
    .then(app => app)
    .catch(error);
};

module.exports = initServer;

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

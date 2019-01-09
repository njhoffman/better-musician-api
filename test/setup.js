const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const request = require('supertest');

const { appName, nameSpace } = require('config');
const { initLogger } = require('lib/utils/logger');

chai.config.includeStack = true;
chai.use(sinonChai);
chai.use(chaiAsPromised);

global.__APP_NAME__ = appName;
global.__APP_NS__ = nameSpace;
global.__SUPPRESS_LOGS__ = process.env.NODE_TEST_QUIET;
global.__SEED_GROUP__ = process.env.NODE_TEST_SEED_GROUP || 'test-standard';

global.sinon = sinon;
global.expect = chai.expect;
global.assert = chai.assert;
global.should = chai.should();
global.proxyquire = proxyquire;
global.request = request;

global._initLogger_ = initLogger(`${nameSpace}-test`);

// TODO: ensure each promise has a catch(done) terminus, integrate custom route error handling for tests
// TODO: configure node-inspector debug listening port

// we want the server to handle expected and unexpected errors
// process.on('uncaughtException', error);
// process.on('unhandledRejection', error);

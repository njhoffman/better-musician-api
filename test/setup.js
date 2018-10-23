const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const request = require('supertest');
// const { fatal, error, warn } = require('debugger-256')('api:test');
// const { fatal, error, warn } = require('../lib/utils/logger')('api:test');


console.log("setting up tests");
chai.config.includeStack = true;
chai.use(sinonChai);
chai.use(chaiAsPromised);

global.sinon = sinon;
global.expect = chai.expect;
global.assert = chai.assert;
global.should = chai.should();
global.proxyquire = proxyquire;
global.request = request;

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
//


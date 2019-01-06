#!/usr/bin/env node

const request = require('request');

const options = {
  url: 'http://localhost:3001/admin/list/',
  headers: {
    'User-Agent' : 'curl'
  }
};

const args = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['all'];

args.forEach((modelName) => {
  options.url += modelName;
  request(options, (error, { statusCode }, body) => {
    if (!error && statusCode === 200) {
      console.log(body);
    } else {
      console.error(error);
    }
  });
});

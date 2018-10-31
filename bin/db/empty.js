#!/usr/bin/env node

const request = require('request');

const options = {
  url: 'http://localhost:3001/admin/empty/',
  headers: {
    'User-Agent' : 'curl'
  }
};

process.argv
  .slice(2)
  .forEach((modelName) => {
    options.url += modelName;
    request(options, (error, { statusCode }, body) => {
      if (!error && statusCode === 200) {
        console.log(body); // Show the HTML for the Google homepage.
      } else {
        console.log(error);
      }
    });
  });

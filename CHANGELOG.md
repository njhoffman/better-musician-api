## [Trunk]
<details><summary>Unreleased version notes (click to see more)</summary>
<p>
### Features
### Fixes
### Other
### Documentation
</p>
</details>

<details><summary> Outstanding tasks... (click to see more)</summary>
<p>
* Create ROADMAP.md for broad goals/brainstorming, get "Outstanding tasks" itemized and implemented with github issues
* Use hexo and follow cypress-documentation method for autogenerating split (by minor version) changelog entries
* Create minor/major version bumper script that autopopulates new changelog snippet with entries from current trunk.
* Bumper script should also auto generate plato reports and track basic stats like # of patches, # of commits, sloc, test coverage, etc. (include in changelog as a "Stats" section accordion).
* Consolidate API configuration with client configuration, fold into common module.
* Think of a way to trigger API pulls and builds on server from npm script (auto execute ssh command with -t switch? security issue?)
* Improve seeding capability to randomize / autopopulate certain data fields.
* Automate dependency diffing on minor/major bump
* Create script to autodiff package.json on major/minor version bumps and create table with the following layout in the changelog (accordiong functionality)

| Type  | Package Name                       | Version  |
|:-----:| ---------------------------------- |:--------:|
|   U   | @babel/core                        |  ^7.0.0  |

</p>
</details>

## 1.1.0
**(October 31, 2018)**

### Features

* Completed migration with all dependencies updated from 1+ year old packages including new babel, eslint, and mocha tests configuration.
* Implement git hooks to automate patch versioning with git pushes to the repository.
* Consolidated structure of route layouts and handling for scalable and consistent growth of the API.
* Established base model functionality to wrap table definitions (such as users, songs) into instantiated models with common CRUD, validation, and error handling utilities.


### Fixes

* All previous linter errors resolved with eslint rules based on airbnb guidelines.
* Fixed broken unit and integration tests resulting from major version augmentation in critical dependencies.
* Implemented validation script to prevent erroneous data being written to database tables.

### Other

* Fix incorrect sharing of context state between `renderToNodeStream()` calls. ([@sebmarkbage](https://github.com/sebmarkbage) in [#14182](https://github.com/facebook/react/pull/14182))
* Add a warning about incorrect usage of the context API. ([@trueadm](https://github.com/trueadm) in [#14033](https://github.com/facebook/react/pull/14033))

### Documentation

* Start CHANGELOG.md with basic layout of future updates.

<details><summary> Core Dependencies (click to see list)</summary>
<p>
*	@babel/core:                       ^7.0.0,
*	@babel/plugin-proposal-decorators: ^7.1.2,
*	@babel/plugin-transform-runtime:   ^7.1.0,
*	@babel/preset-env:                 ^7.1.0,
*	@babel/register:                   ^7.0.0,
*	@babel/runtime:                    ^7.0.0,
*	babel-plugin-add-module-exports:   ^1.0.0,
*	babel-plugin-module-resolver:      ^3.1.1,
*	bcrypt:                            ^3.0.2,
*	better-npm-run:                    ^0.1.1,
*	bluebird:                          ^3.5.2,
*	body-parser:                       ^1.15.2,
*	bunyan:                            ^1.8.12,
*	chalk:                             ^2.4.1,
*	compression:                       ^1.7.3,
*	cookie:                            ^0.3.1,
*	cookie-parser:                     ^1.4.3,
*	debug:                             ^4.1.0,
*	express:                           ^4.16.4,
*	geoip-lite:                        ^1.3.2,
*	http:                              0.0.0,
*	ip:                                ^1.1.4,
*	json-pretty-html:                  ^1.1.5,
*	jsonwebtoken:                      ^8.3.0,
*	lodash:                            ^4.17.11,
*	morgan:                            ^1.9.1,
*	multer:                            ^1.4.1,
*	node-statsd:                       ^0.1.1,
*	passport:                          ^0.4.0,
*	passport-jwt:                      ^4.0.0,
*	passport-local:                    ^1.0.0,
*	piping:                            ^1.0.0-rc.4,
*	request:                           ^2.88.0,
*	response-time:                     ^2.3.2,
*	rethinkdb:                         ^2.3.3,
*	supertest:                         ^3.3.0,
*	useragent:                         ^2.3.0,
*	uuid:                              ^3.3.2,
*	validator:                         ^10.8.0,
*	yargs:                             ^12.0.0
</p>
</details>

<details><summary> Development Dependencies (click to see list)</summary>
<p>
* babel-eslint:              ^10.0.0,
* chai:                      ^4.2.0,
* chai-as-promised:          ^7.1.1,
* coveralls:                 ^3.0.2,
* eslint:                    ^5.0.0,
* eslint-config-airbnb-base: ^13.1.0,
* eslint-config-standard:    ^12.0.0,
* eslint-plugin-babel:       ^5.2.1,
* eslint-plugin-import:      ^2.14.0,
* eslint-plugin-node:        ^7.0.0,
* eslint-plugin-promise:     ^4.0.0,
* eslint-plugin-standard:    ^4.0.0,
* eslint-watch:              ^4.0.2,
* istanbul:                  ^1.0.0-alpha.2,
* mocha:                     ^5.2.0,
* mocha-lcov-reporter:       ^1.3.0,
* mochista:                  ^0.17.0,
* nodemon:                   ^1.18.4,
* plato:                     ^1.7.0,
* proxyquire:                ^2.1.0,
* sinon:                     ^7.0.0,
* sinon-chai:                ^3.2.0
</p>
</details>

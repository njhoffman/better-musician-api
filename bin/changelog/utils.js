const path = require('path');
const npm = require('npm');

const incrementVersion = (baseVersion, isMajorVersion) => (
  isMajorVersion ? [
    `${(parseInt(baseVersion.split('.')[0], 10) + 1)}`,
    '0',
    '0'
  ] : [
    `${baseVersion.split('.')[0]}`,
    `${(parseInt(baseVersion.split('.')[1], 10) + 1)}`,
    '0'
  ]
).join('.');

// TODO: make this configurable
const getMdPath = (name) => path.resolve(__dirname, `../../docs/changelogs/${name}.md`);

const outdatedDeps = (done) => npm.load(() => {
  npm.commands.outdated((err, rawOutdated) => {
    const outdated = rawOutdated.map(od => ({
      name       : od[1],
      current    : od[2],
      wanted     : od[3],
      latest     : od[4],
      definition : od[5]
    }));
    done(null, outdated);
  });
});

module.exports = {
  outdatedDeps,
  incrementVersion,
  getMdPath
};

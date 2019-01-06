// base data to hydrate new user registrations

/* eslint-disable no-console */
module.exports = (models, baseData) => {
  console.log([
    `\n** Unassigned ${__filename.split('/').pop()}`,
    `  (${Object.keys(models).length} models, ${Object.keys(baseData).length} records)`
  ].join('\n'));
  return {};
};
/* eslint-enable no-console */

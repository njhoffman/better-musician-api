// create single user with random fields assigned to random field tabs
// const fieldRange: { min: 0, max: 4} // field range per tab
// const tabRange: { min: 1, max: 6 }

/* eslint-disable no-console */
module.exports = (models, baseData) => {
  console.log([
    `\n** Unassigned ${__filename.split('/').pop()}`,
    `  (${Object.keys(models).length} models, ${Object.keys(baseData).length} records)`
  ].join('\n'));
  return {};
};
/* eslint-enable no-console */

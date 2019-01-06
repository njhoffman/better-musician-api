// create single user with fields assigned to tabs by field type
// const onlyPredefined = false; // use only fields that have predefined values in songs

/* eslint-disable no-console */
module.exports = (models, baseData) => {
  console.log([
    `\n** Unassigned ${__filename.split('/').pop()}`,
    `  (${Object.keys(models).length} models, ${Object.keys(baseData).length} records)`
  ].join('\n'));
  return {};
};
/* eslint-enable no-console */

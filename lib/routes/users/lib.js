const { map, find, omit } = require('lodash');
const { warn, info } = require('../../utils/logger')('routes:users:lib');

const parseCustomFields = (seedCf, userFields) => {
  // hook up ref and refId connections between the custom fields and song seed data
  const match = find(userFields.customFields, { refId: seedCf.ref });
  if (!match) {
    warn(`There was no custom field match for seed data reference: ${seedCf.ref}`);
    return seedCf;
  }
  return ({ ...seedCf, id: match.id });
};

const seedNewUser = (email, num, { User, Song, Field }) => {
  let user;
  return User.modelByField({ email })
    .then(foundUser => {
      if (!foundUser) {
        warn(`Authenticated user ${email} not found for seeding.`);
        return false;
      }
      user = foundUser;
      const { fields: { id: userId } } = foundUser;
      const fieldData = map(Field.seedData, (sd) => ({
        ...omit(sd, 'id'),
        user: userId
      }));
      info(`Seeding ${email} with ${fieldData.length} user associated custom field records`);
      return Field.seed(0, fieldData);
    })
    .then(() => (user.deep()))
    .then((userFields) => {
      info(`Seeding ${email} with ${num > 0 ? num : Song.seedData.length} records`);
      const songData = map(Song.seedData, sd => ({
        ...sd,
        user: userFields.id,
        customFields: sd.customFields.map(seedCf => parseCustomFields(seedCf, userFields))
      }));
      return Song.seed(0, songData);
    })
    .then((results) => ({ records: user.fields, ...results }));
};

module.exports = {
  seedNewUser
};

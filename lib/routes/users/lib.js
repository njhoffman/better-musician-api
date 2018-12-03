const { map, filter, find, omit } = require('lodash');
const { warn, info } = require('lib/utils/logger')('routes:users:lib');

const parseUserFields = (seedCf, userFields) => {
  // hook up ref and refId connections between the user fields and song seed data
  const match = find(userFields.userFields, { refId: seedCf.ref });
  if (!match) {
    warn(`There was no user field match for seed data reference: ${seedCf.ref}`);
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
      const fieldData = map(filter(Field.seedData, 'refId'), (sd) => ({
        ...omit(sd, 'id'),
        user: userId
      }));
      info(`Seeding ${email} with ${fieldData.length} user associated user field records`);
      return Field.seed(0, fieldData);
    })
    .then(() => (user.deep()))
    .then((userFields) => {
      info(`Seeding ${email} with ${num > 0 ? num : Song.seedData.length} records`);
      const songData = map(Song.seedData, sd => ({
        ...sd,
        user: userFields.id,
        userFields: sd.userFields.map(seedUserField => parseUserFields(seedUserField, userFields))
      }));
      return Song.seed(0, songData);
    })
    .then((results) => ({ records: user.fields, ...results }));
};

module.exports = {
  seedNewUser
};

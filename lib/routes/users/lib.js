const seedNewUser = (userId, { Song, Field }) =>
  Field.seed(0, { user: userId })
    .then(() => Song.seed(0, { user: userId }));

module.exports = {
  seedNewUser
};

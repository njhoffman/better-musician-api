const seedNewUser = (userId, { Song, Field }) =>
  Field.seed(4, { user: userId })
    .then(Song.seed(35, { user: userId }));

module.exports = {
  seedNewUser
};

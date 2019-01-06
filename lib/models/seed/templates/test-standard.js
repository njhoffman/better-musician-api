const _ = require('lodash');
const { init, cleanData } = require('../templates');

// create single user with associated predefined song tables
// artists, genres, instruments do not have to be unique to user
module.exports = (models, baseData) => {
  const { loadUsers, loadTier2, loadTier3 } = init(models, baseData);
  const { songs, fieldTabs } = baseData;

  // only pick a few songs to simplify testing
  const subSongs = [songs[0], songs[8], songs[13]];
  const fieldTabFields = _.flatten(_.map(fieldTabs, 'fields'));
  const songFields = _.map(_.flatten(_.map(subSongs, 'userFields')), 'ref');

  const fieldRefs = {
    users: [0, 1],
    instruments: _.uniq(_.map(subSongs, 'instrument')),
    genres: _.uniq(_.map(subSongs, 'genre')),
    artists: _.uniq(_.map(subSongs, 'artist')),
    fields: _.uniq(fieldTabFields, songFields)
  };

  let refUser;

  // tier 1
  const userData = loadUsers({ refs: fieldRefs.users });
  refUser = _.find(userData, { refId: fieldRefs.users[0] });
  const tier2Data = loadTier2(refUser.id, fieldRefs);
  const data = { users: userData, ...tier2Data };

  fieldRefs.users.forEach(userRefId => {
    // tier 3
    refUser = _.find(userData, { refId: userRefId });
    const tier3Data = loadTier3(refUser.id, subSongs, tier2Data);

    _.keys(tier3Data).forEach(tableName => {
      data[tableName] = [].concat(data[tableName], ...tier3Data[tableName]).filter(Boolean);
    });
  });

  return cleanData(data);
};

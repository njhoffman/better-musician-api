const _ = require('lodash');
const { init, cleanData } = require('../templates');

// create single user with associated predefined song tables
// artists, genres, instruments do not have to be unique to user
module.exports = (models, baseData) => {
  const { loadUsers, loadTier2, loadTier3 } = init(models, baseData);
  const { songs, fieldTabs } = baseData;

  const fieldTabFields = _.flatten(_.map(fieldTabs, 'fields'));
  const songFields = _.map(_.flatten(_.map(songs, 'userFields')), 'ref');

  const fieldRefs = {
    users: [0],
    instruments: _.uniq(_.map(songs, 'instrument')),
    genres: _.uniq(_.map(songs, 'genre')),
    artists: _.uniq(_.map(songs, 'artist')),
    fields: _.uniq(fieldTabFields, songFields)
  };

  // tier 1
  const userData = loadUsers({ refs: fieldRefs.users });

  // tier 2
  const refUser = _.find(userData, { refId: 0 });
  const tier2Data = loadTier2(refUser.id, fieldRefs);

  // tier 3
  const tier3Data = loadTier3(refUser.id, songs, tier2Data);

  const data = {
    users: userData,
    ...tier2Data,
    ...tier3Data
  };

  return cleanData(data);
};

const _ = require('lodash');
const { init, cleanData } = require('../templates');

// create a lot of users with associated song field tables
// if songRange max = 0, no associated song field table records created
const mockUsers = 100;
// const songRange = { min: 0, max: 10 };

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
  const userData = loadUsers({ refs: fieldRefs.users, num: mockUsers });

  // tier 2
  // TODO: foreach mock user, load subset of songs, assign fieldRefs, assign tier2, tier3
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

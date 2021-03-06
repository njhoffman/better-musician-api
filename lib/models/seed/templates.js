const _ = require('lodash');
const { loadData, cleanData } = require('./template.utils');

const init = (models, baseData) => {
  const { User, Instrument, Genre, Artist, Field, FieldTab, Song } = models;
  const { users, instruments, fields, genres, artists, fieldTabs } = baseData;

  const loadUsers = ({ refs, num = 0 }) => (
    loadData({ model: User, refs, records: users }, num)
  );

  const loadTier2 = (userId, refs) => {
    const fieldsData = loadData({
      model: Field,
      records: fields,
      refs: refs.fields,
      relations: { user: userId }
    });

    const instrumentsData = loadData({
      model: Instrument,
      records: instruments,
      refs: refs.instruments,
      relations: { user: userId }
    });

    const genresData = loadData({
      model: Genre,
      records: genres,
      refs: refs.genres,
      relations: { user: userId }
    });

    const artistsData = loadData({
      model: Artist,
      records: artists,
      refs: refs.artists,
      relations: { user: userId }
    });

    return {
      fields: fieldsData,
      genres: genresData,
      instruments: instrumentsData,
      artists: artistsData
    };
  };

  const loadTier3 = (userId, songs, tier2Data) => {
    const fieldTabRecords = _.map(_.cloneDeep(fieldTabs), fieldTab => {
      const fieldIds = _.map(fieldTab.fields, fieldId => {
        const refField = _.find(tier2Data.fields, { refId: fieldId });
        if (!refField || !_.has(refField, 'id')) {
          // console.log(`Missing refId: ${fieldId} for tier 3 field data`, tier2Data.fields);
          return null;
        }
        return refField.id;
      });
      return _.merge(fieldTab, { fields: fieldIds });
    });

    const fieldTabsData = loadData({
      model: FieldTab,
      records: fieldTabRecords,
      relations: { user: userId }
    });

    const songRecords = _.map(_.cloneDeep(songs), song => {
      const refs = {
        artist: _.find(tier2Data.artists, { refId: song.artist }).id,
        genre: _.find(tier2Data.genres, { refId: song.genre }).id,
        instrument: _.find(tier2Data.instruments, { refId: song.instrument }).id,
        userFields: _.map(song.userFields, uf => ({
          id: _.find(tier2Data.fields, { refId: uf.ref }).id,
          value: uf.value
        }))
      };
      return _.merge(song, refs);
    });

    const songsData = loadData({
      model: Song,
      records: songRecords,
      relations: {
        user: userId
      }
    });

    return {
      fieldTabs: fieldTabsData,
      songs: songsData
    };
  };

  return {
    loadUsers,
    loadTier2,
    loadTier3
  };
};

module.exports = {
  loadData,
  cleanData,
  init
};

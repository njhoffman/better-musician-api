/* eslint-disable global-require */
// TODO: automate model populating
module.exports = () => ({
  User:       require('./User'),
  Song:       require('./Song'),
  Artist:     require('./Artist'),
  Field:      require('./Field'),
  Instrument: require('./Instrument'),
  Genre:      require('./Genre')
});

/* eslint-enable global-require */

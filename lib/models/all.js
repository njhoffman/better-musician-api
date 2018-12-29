/* eslint-disable global-require */
// TODO: automate model populating
module.exports = () => ({
  User:       require('./ModelTables/User'),
  Song:       require('./ModelTables/Song'),
  Artist:     require('./ModelTables/Artist'),
  Field:      require('./ModelTables/Field'),
  FieldTab:   require('./ModelTables/FieldTab'),
  Instrument: require('./ModelTables/Instrument'),
  Genre:      require('./ModelTables/Genre')
});

/* eslint-enable global-require */

const getModels = () => {
  return {
    User       : require('./User'),
    Song       : require('./Song'),
    Artist     : require('./Artist'),
    Field      : require('./Field'),
    Instrument : require('./Instrument'),
    Genre      : require('./Genre')
  }
};

module.exports = exports = getModels;


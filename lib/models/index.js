const getModels = () => {
  return {
    User       : require('./User'),
    Field      : require('./Field'),
    Song       : require('./Song'),
    Artist     : require('./Artist'),
    Instrument : require('./Instrument'),
    Genre      : require('./Genre')
  }
};

module.exports = exports = getModels;


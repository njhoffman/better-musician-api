const getDbModule = require("../utils/db").getDbModule;
const BaseModel = require('./_BaseModel');
const exampleInstruments = require('./exampleData/instruments');

const { debug } = require("debugger-256")("api:model:instrument");

class Instrument extends BaseModel {
  static get tableName() { return "instruments" }
  static get tableKeys() {
    return ["email", "uid", "id"];
  }
  static get exampleData() { return exampleInstruments; }
  constructor(instrument) {
    super();
  }
  save() {
    return getDbModule()
      .db
      .table(Instrument.tableName)
      .insert({
        email: this.email,
        password: this.password
      })
      .run(getDbModule().conn)
      .then((res) => {
        if (res.inserted === 1) {
          this.id = res.generated_keys[0];
          return { email: this.email, id: this.id };
        } else {
          debug("ERROR %O", res);
        }
      });
  }
};
module.exports = exports = Instrument;

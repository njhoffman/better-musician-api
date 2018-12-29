const allModels = require('lib/models')();
const ModelBase = require('lib/models/ModelBase');

const defaultData = {
  User: {
    email: 'testemail@test.com'
  },
  Artist: {
    lastName: 'testNameVal',
    user: 0
  },
  Instrument: {
    name: 'testNameVal',
    user: 0
  },
  Genre: {
    name: 'testNameVal',
    user: 0
  },
  Field: {
    user: 0,
    type: 'testTypeVal',
    label: 'testLabelVal',
  },
  FieldTab: {
    user: 0,
    name: 'testNameVal'
  },
  Song: {
    user: 0,
    artist: 0,
    title: 'testTitleVal',
    instrument: 0
  }
};

// test that user fields have authLock assigned
// check foreign keys fields and reverse key deep fields are accessible
module.exports = function() {
  describe('Models (Standard)', () => {
    Object.keys(allModels).forEach(modelKey => {
      const Model = allModels[modelKey];
      const newModel = new Model(defaultData[modelKey]);

      describe(`${modelKey}`, () => {
        it('Should have static properties tableName, modelName, and tableKeys', () => {
          expect(newModel).to.contain.property('tableName').that.is.a('string');
          expect(newModel).to.contain.property('modelName').that.is.a('string');
          expect(newModel).to.contain.property('tableKeys').that.is.an('object');
        });

        it('Should have modelBase static database getters', () => {
          expect(newModel.constructor).to.contain.property('args').that.is.an('function');
          expect(newModel.constructor).to.contain.property('row').that.is.an('function');
          expect(newModel.constructor).to.contain.property('db').that.is.an('function');
          expect(newModel.constructor).to.contain.property('conn').that.is.an('object');
        });

        it('Should be have modelBase static properties fields', () => {
          expect(newModel).to.contain.property('fields').that.is.an('object');
        });

        it('Should call base constructor with model data and instance data', () => {
          const ModelBaseStub = sinon.stub(ModelBase.prototype, 'constructor');
          const ModelProxy = proxyquire(
            `../lib/models/ModelTables/${modelKey}`, {
              '../ModelBase' : ModelBaseStub
            }
          );
          /* eslint-disable no-unused-vars */
          const newModelProxy = new ModelProxy({ id: 'test_id' });
          /* eslint-enable no-unused-vars */
          expect(ModelBaseStub).to.have.been.calledOnce;
          expect(ModelBaseStub.args[0]).to.have.length.gt(1);
          expect(ModelBaseStub.args[0][0]).to.contain.keys('tableName', 'modelName', 'tableKeys');
          expect(ModelBaseStub.args[0][1]).to.contain({ id: 'test_id' });
          ModelBaseStub.restore();
        });

        it('tableKeys should have an id field', () => {
          expect(newModel).to.contain.property('tableKeys').that.is.an('object').that.contains.property('id');
        });

        const fKeys =  Object.keys(newModel.tableKeys).filter(tk => (
          Object.prototype.hasOwnProperty.call(newModel.tableKeys[tk], 'relation')
            ? newModel.tableKeys[tk]
            : null
        ));

        fKeys.forEach(fk => {
          it(`Foreign key "${fk}" should have a "Model" property pointing to linked model`, () => {
            expect(newModel.tableKeys)
              .to.contain.property(fk)
              .that.is.an('object')
              .that.contains.property('relation')
              .that.is.an('object')
              .that.contains.property('Model');
          });
        });
      });
    });
    // TODO: test required fields return error, bad fields get filtered with warnings, test validation
  });
};

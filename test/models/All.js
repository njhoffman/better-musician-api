const allModels = require('lib/models')();
const _BaseModel = require('lib/models/_BaseModel');

module.exports = function() {
  describe('Models (Standard)', () => {
    Object.keys(allModels).forEach(modelKey => {
      const Model = allModels[modelKey];
      const newModel = new Model();

      describe(`${modelKey}`, () => {
        it('Should be have static properties tableName, modelName, and tableKeys', () => {
          expect(newModel).to.contain.property('tableName').that.is.a('string');
          expect(newModel).to.contain.property('modelName').that.is.a('string');
          expect(newModel).to.contain.property('tableKeys').that.is.an('object');
        });

        it('Should be have baseModel static properties warnings and errors', () => {
          expect(newModel).to.contain.property('warnings').that.is.an('array');
          expect(newModel).to.contain.property('errors').that.is.an('array');
        });

        it('Should be have baseModel static properties cleanFields', () => {
          expect(newModel).to.contain.property('cleanFields').that.is.an('object');
        });

        it('Should call base constructor with model data and instance data', () => {
          const _BaseModelStub = sinon.stub(_BaseModel.prototype, 'constructor');
          const ModelProxy = proxyquire(
            `../lib/models/${modelKey}`, {
              './_BaseModel' : _BaseModelStub
            }
          );
          /* eslint-disable no-unused-vars */
          const newModelProxy = new ModelProxy({ id: 'test_id' });
          /* eslint-enable no-unused-vars */
          expect(_BaseModelStub).to.have.been.calledOnce;
          expect(_BaseModelStub.args[0]).to.have.length.gt(1);
          expect(_BaseModelStub.args[0][0]).to.contain.keys('tableName', 'modelName', 'tableKeys');
          expect(_BaseModelStub.args[0][1]).to.contain({ id: 'test_id' });
          _BaseModelStub.restore();
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

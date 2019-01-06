const _ = require('lodash');
const { login, setupServer, getSeedData, outModelAll } = require('../../utils');

module.exports = function fieldsUpdateE2E(routes) {
  describe('/fields/update', () => {
    const { fields } = getSeedData();
    let app;
    const data = {
      id: fields[0].id,
      label: 'New Label',
      typeId: 0
    };

    after(function() {
      routes.push('/fields/update');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .post('/fields/update')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should update existing field with validated fields', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/fields/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records).to.be.an('array').with.length(1);
              expect(res.body.records[0]).to.be.an('object').that.contains(data);
              return outModelAll('Field');
            })
            .then(res => {
              const updatedField = _.find(res, { id: fields[0].id });
              expect(updatedField).to.be.an('object').that.contains(data);
              done();
            })
            .catch(done);
        });
    });

    it('Should ignore fields not in table schema', (done) => {
      _.merge(data, { _badFieldName: 'shouldnt exist' });
      login(app)
        .then(headers => {
          request(app)
            .post('/fields/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records).to.be.an('array').with.length(1);
              expect(res.body.records[0]).to.be.an('object').that.contains({ id: fields[0].id });
              expect(res.body.records[0]).to.not.have.property('_badFieldName');
              return outModelAll('Field');
            })
            .then(res => {
              const updatedField = _.find(res, { id: fields[0].id });
              expect(updatedField).to.be.an('object').that.contains({ id: fields[0].id });
              expect(updatedField).to.not.have.property('_badFieldName');
              done();
            })
            .catch(done);
        });
    });
  });
};

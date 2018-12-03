const { login, setupServer, outModelAll } = require('../../utils');

module.exports = function fieldsUpdateE2E(routes) {
  describe('/fields/update', () => {
    let app;

    const fieldId =  '60000000-0000-0000-0000-000000000000';

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
      const data = {
        id: '60000000-0000-0000-0000-000000000000',
        label: 'New Label',
        type: 0
      };
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
              expect(res[0]).to.be.an('object').that.contains(data);
              done();
            })
            .catch(done);
        });
    });

    it('Should ignore fields not in table schema', (done) => {
      const data = {
        _badFieldName: 'shouldnt exist',
        id: fieldId,
        type: '0',
        label: 'New Label'
      };
      login(app)
        .then(headers => {
          request(app)
            .post('/fields/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records).to.be.an('array').with.length(1);
              expect(res.body.records[0]).to.be.an('object').that.contains({ id: fieldId });
              expect(res.body.records[0]).to.not.have.property('_badFieldName');
              return outModelAll('Field');
            })
            .then(res => {
              expect(res[0]).to.be.an('object').that.contains({ id: fieldId });
              expect(res[0]).to.not.have.property('_badFieldName');
              done();
            })
            .catch(done);
        });
    });
  });
};

const { login, logout, setupServer, outModelAll } = require('../../utils');

module.exports = function() {
  describe('/fields/update', () => {
    let app;

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => (app = _app));
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
      const data = { id: "0", label: 'New Label', tabName: 'New Tab Name', type: 0 };
      login(app)
        .then(headers => {
          request(app)
            .post('/fields/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains(data);
              return outModelAll('Field');
            }).then(res => {
              expect(res[0]).to.be.an('object').that.contains(data);
              done();
            }).catch(done);
        });
    });

    it('Should ignore fields not in table schema', (done) => {
      const data = { _badFieldName: 'shouldnt exist', id: "0", type: "0", tabName: 'New Tab Name', label: 'New Label' };
      login(app)
        .then(headers => {
          request(app)
            .post('/fields/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains({ id: "0" });
              expect(res.body.data).to.not.have.property('_badFieldName');
              return outModelAll('Field');
            }).then(res => {
              expect(res[0]).to.be.an('object').that.contains({ id: "0" });
              expect(res[0]).to.not.have.property('_badFieldName');
              done();
            }).catch(done);
        });
    });


  });
}

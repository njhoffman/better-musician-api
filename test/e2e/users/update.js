const { login, setupServer } = require('../../utils');

module.exports = function(routes) {
  describe('/users/update', () => {
    let app;

    after(function() {
      routes.push('/users/update');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .post('/users/update')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should update validated fields', (done) => {
      const data = { maxDifficulty: 13 };
      login(app)
        .then(headers => {
          request(app)
            .post('/users/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records).to.be.an('array').with.length(1);
              expect(res.body.records[0]).to.be.an('object').that.contains(data);
              return request(app).get('/admin/list/users');
            })
            .then(res => {
              expect(res.body.records[0])
                .to.be.an('object')
                .that.contains({ email: 'testuser@example.com', maxDifficulty: 13 });
              done();
            })
            .catch(done);
        });
    });

    it('Should ignore fields not in table schema', (done) => {
      const data = { _badFieldName: 'shouldnt exist' };
      login(app)
        .then(headers => {
          request(app)
            .post('/users/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records).to.be.an('array').with.length(1);
              expect(res.body.records[0]).to.not.contain(data);
              return request(app).get('/admin/list/users');
            })
            .then(res => {
              expect(res.body.records).to.be.an('array').with.length(3);
              expect(res.body.records[0]).to.be.an('object').that.contains({ email: 'testuser@example.com' });
              expect(res.body.records[0]).to.not.contain(data);
              done();
            })
            .catch(done);
        });
    });
  });
};

const { login, logout, setupServer } = require('../../utils');

module.exports = function() {
  describe('/songs/empty', () => {
    let app;

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => (app = _app));
    });
    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .get('/songs/empty')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should empty all songs associated with user', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .get('/songs/empty')
            .set(headers)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              return request(app).get('/songs').set(headers);
            }).then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data.tables)
                .to.be.an('object')
                .that.has.property('songs')
                .that.is.an('array')
                .with.length(0);
              done();
            }).catch(done);
        });
    });
  });
}


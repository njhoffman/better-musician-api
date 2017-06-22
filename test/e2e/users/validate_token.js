const { login, logout, setupServer } = require('../../utils');

module.exports = function() {
  describe('/users/validate_token', () => {
    let app;

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => (app = _app));
    });
    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .get('/users/validate_token')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should return user information if authenticated', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .get('/users/validate_token')
            .set(headers)
            .end((err, res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains({ email: 'testuser@example.com' });
              done();
            });
        });
    });
  });
}


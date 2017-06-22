const { login, logout, setupServer } = require('../../utils');

module.exports = function() {
  describe('/fields/seed', () => {
    let app;

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => (app = _app));
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .get('/fields/seed')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
  });
}


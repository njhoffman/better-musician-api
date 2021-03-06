const { setupServer, getSeedData } = require('../utils');

module.exports = function(routes) {
  describe('Main API', () => {
    const { users } = getSeedData();
    let app;

    after(function() {
      routes.push('/version');
    });

    before(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => {
          app = _app;
        });
    });

    it('Should return version number', (done) => {
      request(app)
        .get('/version')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.body.version).to.be.ok;
          expect(res.statusCode).to.equal(200);
          done();
        });
    });

    it('Should return 404 if page not registered', (done) => {
      request(app)
        .get('/123412341234')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(404);
          done();
        });
    });

    // needed for other tests
    it('Should authenticate with correct credentials (db utility function)', (done) => {
      request(app)
        .post('/users/login')
        .send({
          'email-sign-in-email': 'testuser@example.com',
          'email-sign-in-password': 'dummypassword'
        })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(200);
          expect(res.body.records).to.be.an('array').with.length(1);
          expect(res.body.records[0]).to.be.an('object').that.contains({ id: users[0].id });
          done(err);
        });
    });
  });
};

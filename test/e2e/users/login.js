const { setupServer } = require('test/utils');

module.exports = function(routes) {
  // tested in main api test
  describe('/users/login', () => {
    let app;

    after(function() {
      routes.push('/users/login');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

    it('Should authenticate with correct credentials', (done) => {
      request(app)
        .post('/users/login')
        .send({
          'email-sign-in-email': 'testuser@example.com',
          'email-sign-in-password': 'dummypassword'
        })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(200);
          // expect(res.body.records).to.be.an('object').that.contains.key('records');
          expect(res.body.records).to.be.an('array').with.length(1);
          expect(res.body.records[0]).to.be.an('object').that.contains({
            id: '30000000-0000-0000-0000-000000000000'
          });
          done(err);
        });
    });

    it('Should fail authentication with incorrect credentials', (done) => {
      request(app)
        .post('/users/login')
        .send({
          'email-sign-in-email': 'baduser@example.com',
          'email-sign-in-password': 'badpassword'
        })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(401);
          routes.push('/users/login');
          done(err);
        });
    });
  });
};

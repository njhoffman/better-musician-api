const { login, setupServer } = require('../../utils');

module.exports = function(routes) {
  describe('/users/logout', () => {
    let app;

    after(function() {
      routes.push('/users/logout');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => {
          app = _app;
        });
    });

    it('Should logout user', (done) => {
      login(app).then(headers => {
        request(app)
          .delete('/users/logout')
          .set(headers)
          .end((err, res) => {
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.be.an('object').that.contains({ success: true });
            done(err);
          });
      });
    });
  });
};

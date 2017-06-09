require('../../../lib/utils/server.babel'); // babel registration (runtime transpilation for node)


describe('API Tests', () => {
  let app;
  before(function(done) {
    this.timeout(10000);
    const server = require('../../../lib/server');
    server.initServer().then((_app) => {
      app = _app;
      done();
    });
  });

  after((done) => {
    done();
  });

  it('Should return version number', (done) => {
    request(app)
      .get('/version')
      .end((err, res) => {
        expect(res.body.version).to.be.ok;
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('Should return 404 if page not registered', (done) => {
    request(app)
      .get('/123412341234')
      .end((err, res) => {
        expect(res.statusCode).to.equal(404);
        done();
      });
  });
});

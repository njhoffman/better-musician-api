require('../../../lib/utils/server.babel'); // babel registration (runtime transpilation for node)
const { setupServer } = require('../utils');

describe('Main API', () => {
  let app;

  before(function() {
    this.timeout(10000);
    return setupServer()
      .then(_app => (app = _app));
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
  it('Should authenticate with correct credentials', (done) => {
    request(app)
      .post('/users/login')
      .send({
        'email-sign-in-email': 'testuser@example.com',
        'email-sign-in-password': 'dummypassword'
      }).end((err, res) => {
        expect(err).to.be.null;
        expect(res.statusCode).to.equal(200);
        expect(res.body.data).to.be.an('object').that.contains({ id: 0 });
        done();
      });
  });
});

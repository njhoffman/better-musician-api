require('../../../lib/utils/server.babel'); // babel registration (runtime transpilation for node)

describe('User Routes', () => {
  let app;
  before(function(done) {
    this.timeout(10000);
    const server = require('../../../lib/server');
    server.initServer()
      .then((_app) => {
        app = _app;
        done();
      });
  });

  after((done) => {
    done();
  });

  // describe('/register', () => {
  // });
  // describe('/login', () => {
  // });
  // describe('/update', () => {
  // });
  describe('/me', () => {
    // it('Should return user information', () => {
    //   request(app)
    //     .get('/users/me')
    //     .end((err, res) => {
    //       expect(res.body.version).to.be.ok;
    //       expect(res.statusCode).to.equal(200);
    //       done();
    //     });
    // });
    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .get('/users/me')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
  });
  // describe('/logout', () => {
  // });
});


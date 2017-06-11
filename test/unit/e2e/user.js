const { login, setupServer } = require('../utils');

describe('User Routes', () => {
  let app;

  before(function() {
    this.timeout(10000);
    return setupServer()
      .then(_app => (app = _app));
  });

  after((done) => {
    done();
  });

  // tested in main api test
  // describe('/login', () => {})

  // describe('/register', () => {
  // });
  // describe('/update', () => {
  //
  // });
  describe('/me', () => {
    it('Should return user information', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .get('/users/me')
            .set(headers)
            .end((err, res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.user).to.be.an('object').that.contains({ email: 'testuser@example.com' });
              done();
            });
        });
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .get('/users/me')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
  });

  describe('/logout', () => {
    // it('Should logout user', (done) => {
    //   login(app)
    //     .then(headers => {
    //       request(app)
    //         .get('/users/me')
    //         .set(headers)
    //         .end((err, res) => {
    //           expect(res.statusCode).to.equal(200);
    //           expect(res.body.user).to.be.an('object').that.contains({ email: 'testuser@example.com' });
    //           done();
    //         });
    //     });
    // });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .get('/users/logout')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
  });
});


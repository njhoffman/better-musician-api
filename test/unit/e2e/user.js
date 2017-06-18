const { login, logout, setupServer } = require('../utils');

describe('User Routes', () => {
  let app;

  beforeEach(function() {
    this.timeout(10000);
    return setupServer()
      .then(_app => (app = _app));
  });

  // tested in main api test
  describe('/login', () => {
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

    it('Should fail authentication with incorrect credentials', (done) => {
      request(app)
        .post('/users/login')
        .send({
          'email-sign-in-email': 'baduser@example.com',
          'email-sign-in-password': 'badpassword'
        }).end((err, res) => {
          expect(err).to.be.null;
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
  })

  describe('/register', () => {
    it('Should return 400 with error message if password not provided', (done) => {
      const data = { 'email-sign-up-email' : 'testuser@example.com' };
      request(app)
        .post('/users/register')
        .send(data)
        .end((err, res) => {
          expect(res.statusCode).to.equal(400);
          done();
        });
    });

    it('Should return 401 with error message if email already registered', (done) => {
      const data = { 'email-sign-up-email' : 'testuser@example.com', 'email-sign-up-password': 'shouldntmatter' };
      request(app)
        .post('/users/register')
        .send(data)
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should create a new user with default properties', (done) => {
      const data = { 'email-sign-up-email' : 'new-testuser@example.com', 'email-sign-up-password': 'newpassword' };
      request(app)
        .post('/users/register')
        .send(data)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body.data).to.be.an('object').that.contains.keys('id', 'email', 'maxDifficulty');
          return request(app).get('/admin/list/User')
        }).then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body).to.be.an('array').that.has.length(4);
          expect(res.body[3]).to.be.an('object').that.contains.keys('id', 'email', 'maxDifficulty');
          done();
        }).catch(done);
    });

    it('Should seed the new user with example custom fields', (done) => {
      const data = { 'email-sign-up-email' : 'new-testuser@example.com', 'email-sign-up-password': 'newpassword' };
      request(app)
        .post('/users/register')
        .send(data)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          return request(app).get('/admin/list/User/deep')
        }).then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body[3]).to.be.an('object').that.has.property('customFields').with.length(4);
          done();
        }).catch(done);
    });

    it('Should seed the new user with example songs including associated custom fields', (done) => {
      const data = { 'email-sign-up-email' : 'new-testuser@example.com', 'email-sign-up-password': 'newpassword' };
      request(app)
        .post('/users/register')
        .send(data)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          return request(app).get('/admin/list/User/deep')
        }).then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body[3]).to.be.an('object').that.has.property('songs').with.length(16);
          res.body[3].songs.forEach(song => {
            expect(song).to.be.an('object').that.has.property('customFields');
            expect(song.customFields).to.be.an('array').with.length(4);
            song.customFields.forEach(cf => {
              expect(cf).to.be.an('object').with.property('id').that.is.not.empty;
            });
          });
          done();
        }).catch(done);
    });
  });

  describe('/validate_token', () => {
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

  describe('/update', () => {

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .post('/users/update')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should update validated fields', (done) => {
      const data = { maxDifficulty: 13 };
      login(app)
        .then(headers => {
          request(app)
            .post('/users/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains({ email: 'testuser@example.com', maxDifficulty: 13 });
              return request(app).get('/admin/list/users')
            }).then(res => {
              expect(res.body[0]).to.be.an('object').that.contains({ email: 'testuser@example.com', maxDifficulty: 13 });
              done();
            }).catch(done);
        });
    });

    it('Should ignore fields not in table schema', (done) => {
      const data = { _badFieldName: 'shouldnt exist' };
      login(app)
        .then(headers => {
          request(app)
            .post('/users/update')
            .set(headers)
            .send(data)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains({ email: 'testuser@example.com' });
              expect(res.body.data).to.not.contain(data);
              return request(app).get('/admin/list/users');
            }).then(res => {
              expect(res.body[0]).to.be.an('object').that.contains({ email: 'testuser@example.com' });
              expect(res.body[0]).to.not.contain(data);
              done();
            }).catch(done);
        });
    });
  });

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
    it('Should logout user', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .delete('/users/logout')
            .set(headers)
            .end((err, res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains({ email: 'testuser@example.com' });
              done();
            });
        });
    });

    it('Should not allow access to unauthorized pages after logout', (done) => {
      login(app)
        .then(headers => logout(app, headers))
        .then(() => {
          request(app)
            .get('/users/me')
            .end((err, res) => {
              expect(res.statusCode).to.equal(401);
              done();
            });
        });
    });

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


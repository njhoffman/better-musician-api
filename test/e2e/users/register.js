const { find } = require('lodash');
const { setupServer } = require('../../utils');

module.exports = function UserRegisterE2E(routes) {
  describe('/users/register', () => {
    let app;

    after(function() {
      routes.push('/users/register');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

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
      let savedId;
      request(app)
        .post('/users/register')
        .send(data)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body.data)
            .to.be.an('object')
            .that.contains.keys('id', 'email', 'maxDifficulty');
          savedId = res.body.data.id;
          return request(app).get('/admin/list/User');
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          expect(res.body.data)
            .to.be.an('array')
            .that.has.length(4);
          const savedUser = find(res.body.data, { id: savedId });
          expect(savedUser)
            .to.be.an('object')
            .that.contains.keys('id', 'email', 'maxDifficulty');
          done();
        })
        .catch(done);
    });

    it('Should seed the new user with example custom fields', (done) => {
      const data = { 'email-sign-up-email' : 'new-testuser@example.com', 'email-sign-up-password': 'newpassword' };
      let savedId;
      request(app)
        .post('/users/register')
        .send(data)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          savedId = res.body.data.id;
          return request(app).get('/admin/list/User/deep');
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          const savedUser = find(res.body.data, { id: savedId });
          expect(savedUser)
            .to.be.an('object')
            .that.has.property('customFields')
            .with.length(4);

          done();
        })
        .catch(done);
    });

    it('Should populate new user seed data with custom fields', (done) => {
      const data = { 'email-sign-up-email' : 'new-testuser@example.com', 'email-sign-up-password': 'newpassword' };
      let savedId;
      request(app)
        .post('/users/register')
        .send(data)
        .then(res => {
          expect(res.statusCode).to.equal(200);
          savedId = res.body.data.id;
          return request(app).get('/admin/list/User/deep');
        })
        .then(res => {
          expect(res.statusCode).to.equal(200);
          const savedUser = find(res.body.data, { id: savedId });
          expect(savedUser).to.be.an('object').that.has.property('songs').with.length(16);
          savedUser.songs.forEach(song => {
            expect(song)
              .to.be.an('object')
              .that.has.property('customFields');
            expect(song.customFields)
              .to.be.an('array')
              .with.length(4);
            song.customFields.forEach(cf => {
              expect(cf)
                .to.be.an('object')
                .with.property('id')
                .that.is.not.empty;
            });
          });
          done();
        })
        .catch(done);
    });
  });
};

const _ = require('lodash');
const { login, setupServer, getSeedData } = require('../../utils');

module.exports = function SongsIndexE2E(routes) {
  describe('/songs', () => {
    const { fields, instruments, genres, artists, songs, users } = getSeedData();
    const userSongs = _.filter(songs, { user: users[0].id });
    let app;

    after(function() {
      routes.push('/songs');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .get('/songs')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should return songs if authenticated', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .get('/songs')
            .set(headers)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records).to.be.an('array').with.length(1);
              expect(res.body.records[0].songs).to.be.an('array').with.length(userSongs.length);
              done();
            })
            .catch(done);
        });
    });

    it('Should return records from linked foreign tables', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .get('/songs')
            .set(headers)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records[0])
                .to.have.property('fields')
                .that.is.an('array')
                .that.has.length(fields.length);
              expect(res.body.records[0])
                .to.have.property('instruments')
                .that.is.an('array')
                .that.has.length(instruments.length);
              expect(res.body.records[0])
                .to.have.property('genres')
                .that.is.an('array')
                .that.has.length(genres.length);
              expect(res.body.records[0])
                .to.have.property('artists')
                .that.is.an('array')
                .that.has.length(artists.length);
              done();
            })
            .catch(done);
        });
    });
  });
};

const _ = require('lodash');
const { login, setupServer, getSeedData } = require('../../utils');

module.exports = function SongsAddE2E(routes) {
  describe('/songs/add', () => {
    const { users, instruments, songs } = getSeedData();
    const userSongs = _.filter(songs, { user: users[0].id });
    let app;

    const mockSong = {
      title: 'My example song',
      artist: { lastName: 'Thrustmaster', firstName: 'Gonzo' },
      instrument: {
        name: 'Piano'
      }
    };

    const mockSongUniq = {
      title: 'My example unique instrument song',
      artist: { lastName: 'Thrustmaster', firstName: 'Gonzo' },
      instrument: {
        name: 'New Instrument'
      }
    };

    after(function() {
      routes.push('/songs/add');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .post('/songs/add')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should add a song if required fields exist', (done) => {
      login(app)
        .then(headers => (
          request(app)
            .post('/songs/add')
            .set(headers)
            .send(mockSong)
            .then((res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records).to.be.an('array').with.length(1);
              expect(res.body.records[0]).to.be.an('object')
                .that.contains.keys(['title', 'artist', 'instrument', 'id']);
              return request(app)
                .get('/songs')
                .set(headers);
            })
            .then((res, err) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records[0]).to.be.an('object')
                .that.has.property('songs')
                .with.length(userSongs.length + 1);
              done(err);
            })
            .catch(done)
        ));
    });

    it('Should return shallow foreign key relationships (ids) after creating', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/add')
            .set(headers)
            .send(mockSong)
            .then((res, err) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records[0].artist).to.not.be.an('object');
              expect(res.body.records[0].artist).to.be.a('string');
              expect(res.body.records[0].instrument).to.not.be.an('object');
              expect(res.body.records[0].instrument).to.be.a('string');
              expect(res.body.records[0].user).to.not.be.an('object');
              expect(res.body.records[0].user).to.be.a('string');
              done(err);
            })
            .catch(done);
        });
    });

    it('Should add a song with existing foreign records if unique data is matched', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/add')
            .set(headers)
            .send(mockSong)
            .then((res, err) => {
              if (err) {
                return done(err);
              }
              expect(res.statusCode).to.equal(200);
              return request(app)
                .get('/songs')
                .set(headers);
            })
            .then((res, err) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records[0].songs).to.be.an('array').with.length(userSongs.length + 1);
              expect(res.body.records[0].instruments).to.be.an('array').with.length(instruments.length);
              expect(res.body.records[0].songs.pop()).to.contain({
                instrument: instruments[0].id,
                user:  users[0].id
              });
              done(err);
            })
            .catch(done);
        });
    });

    it('Should add a song with new foreign records if unique data is different', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/add')
            .set(headers)
            .send(mockSongUniq)
            .then((res) => {
              expect(res.statusCode).to.equal(200);
              return request(app)
                .get('/songs')
                .set(headers);
            })
            .then((res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records[0].songs).to.be.an('array').with.length(userSongs.length + 1);
              expect(res.body.records[0].instruments).to.be.an('array').with.length(instruments.length + 1);
              expect(res.body.records[0].songs.pop()).to.contain.key('instrument').that.is.not.equal(instruments[0].id);
              done();
            })
            .catch(done);
        });
    });
  });
};

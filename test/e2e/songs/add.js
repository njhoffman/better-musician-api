const { login, setupServer } = require('../../utils');

module.exports = function SongsAddE2E(routes) {
  describe('/songs/add', () => {
    let app;

    const mockSong = {
      title: 'My example song',
      artist: { lastName: 'Thrustmaster', firstName: 'Gonzo' },
      instrument: {
        user: '30000000-0000-0000-0000-000000000000',
        name: 'piano'
      }
    };

    const mockSongUniq = {
      title: 'My example song',
      artist: { lastName: 'Thrustmaster', firstName: 'Gonzo' },
      instrument: {
        user: '30000000-0000-0000-0000-000000000000',
        name: 'new instrument'
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
        .then(headers => {
          request(app)
            .post('/songs/add')
            .set(headers)
            .send(mockSong)
            .then((res, err) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains.keys(['title', 'artist', 'instrument', 'id']);
              expect(res.body.data.artist).to.not.be.an('object');
              expect(res.body.data.instrument).to.not.be.an('object');
              return err
                ? done(err)
                : request(app)
                  .get('/songs')
                  .set(headers);
            })
            .then((res, err) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.has.property('songs').with.length(17);
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
            .send(mockSongUniq)
            .then((res, err) => {
              expect(res.statusCode).to.equal(200);
              return err
                ? done(err)
                : request(app)
                  .get('/songs')
                  .set(headers);
            })
            .then((res, err) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data.songs[16]).to.contain({
                instrument: '40000000-0000-0000-0000-000000000000',
                user: '30000000-0000-0000-0000-000000000000',
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
            .then((res, err1) => {
              expect(res.statusCode).to.equal(200);
              return request(app)
                .get('/songs')
                .set(headers);
            })
            .then((res, err2) => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data.songs[16]).to.contain.key('instrument').that.is.not.equal('0');
              done();
            })
            .catch(done);
        });
    });
  });
};

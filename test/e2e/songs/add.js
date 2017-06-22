const { login, logout, setupServer } = require('../../utils');

module.exports = function() {
  describe('/songs/add', () => {
    let app;

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => (app = _app));
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
      const mockSong = { title: 'My example song', artist: { lastName: 'Thrustmaster', firstName: 'Gonzo' }, instrument: { name: 'piano' } };
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/add')
            .set(headers)
            .send(mockSong)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains.keys(['title', 'artist', 'instrument', 'id']);
              expect(res.body.data.artist).to.not.be.an('object');
              expect(res.body.data.instrument).to.not.be.an('object');
              return request(app).get('/songs').set(headers);
            }).then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data.tables)
                .to.be.an('object')
                .that.has.property('songs')
                .with.length(17);
              done();
            }).catch(done);
        });
    });

    it('Should add a song with existing foreign records if unique data is matched', (done) => {
      const mockSong = { title: 'My example song', artist: { lastName: 'Thrustmaster', firstName: 'Gonzo' }, instrument: { name: 'piano' } };
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/add')
            .set(headers)
            .send(mockSong)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              return request(app).get('/songs').set(headers);
            }).then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data.tables.songs[16]).to.contain({ instrument: 0, user: 0 });
              done();
            }).catch(done);
        });
    });

    it('Should add a song with new foreign records if unique data is different', (done) => {
      const mockSong = { title: 'My example song', artist: { lastName: 'Thrustmaster', firstName: 'Gonzo' }, instrument: { name: 'new instrument' } };
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/add')
            .set(headers)
            .send(mockSong)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              return request(app).get('/songs').set(headers);
            }).then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data.tables.songs[16]).to.contain.key('instrument').that.is.not.equal(0);
              done();
            }).catch(done);
        });
    });
  });
}

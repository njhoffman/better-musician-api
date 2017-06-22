const { login, logout, setupServer } = require('../utils');

describe('Song Routes', () => {
  let app;

  beforeEach(function() {
    this.timeout(10000);
    return setupServer()
      .then(_app => (app = _app));
  });

  describe('/songs', () => {
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
              expect(res.body).to.be.an('object')
                .that.has.property('data')
                .that.is.an('object')
                .that.has.property('tables')
                .that.is.an('object')
              expect(res.body.data.tables)
                .to.have.property('songs')
                .that.is.an('array')
                .that.has.length(16);
              done();
            }).catch(done);
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
              expect(res.body.data.tables)
                .to.have.property('fields')
                .that.is.an('array')
                .that.has.length(4);
              expect(res.body.data.tables)
                .to.have.property('instruments')
                .that.is.an('array')
                .that.has.length(1);
              expect(res.body.data.tables)
                .to.have.property('genres')
                .that.is.an('array')
                .that.has.length(1);
              expect(res.body.data.tables)
                .to.have.property('artists')
                .that.is.an('array')
                .that.has.length(8);
              done();
            }).catch(done);
        });
    });
  });

  describe('/songs/empty', () => {
    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .get('/songs/empty')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should empty all songs associated with user', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .get('/songs/empty')
            .set(headers)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              return request(app).get('/songs').set(headers);
            }).then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data.tables)
                .to.be.an('object')
                .that.has.property('songs')
                .that.is.false;
              done();
            }).catch(done);
        });
    });
  });

  describe('/songs/delete', () => {
    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .post('/songs/delete')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should delete a song if valid id is submitted', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/delete')
            .set(headers)
            .send({ id: 3 })
            .then(res => {
              expect(res.statusCode).to.equal(200);
              console.log('delete', res.body);
              done();
            }).catch(done);
        });
    });
  });

  describe('/songs/add', () => {
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
});


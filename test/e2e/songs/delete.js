const { login, logout, setupServer } = require('../../utils');

module.exports = function(routes) {
  describe('/songs/delete', () => {
    let app;

    after(function() {
      routes.push('/songs/delete');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => (app = _app));
    });

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
            .get('/songs')
            .set(headers)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              const song = res.body.data.tables.songs.pop();
              return request(app)
                .post('/songs/delete')
                .set(headers)
                .send({ id: song.id });
            }).then(res => {
              expect(res.body.data).to.be.an('object').that.contains({ deleted: 1 });
              return request(app).get('/songs').set(headers);
            }).then(res => {
              expect(res.body.data).to.be.an('object')
                .that.has.property('tables')
                .that.has.property('songs')
                .that.has.length(15);
              done();
            }).catch(done);
        });
    });

    it('Should not delete a song if an invalid id is submitted', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/delete')
            .set(headers)
            .send({ id: 'BADID' })
            .then(res => {
              expect(res.body.data).to.be.an('object').that.contains({ deleted: 0 });
              return request(app).get('/songs').set(headers);
            }).then(res => {
              expect(res.body.data).to.be.an('object')
                .that.has.property('tables')
                .that.has.property('songs')
                .that.has.length(16);
              done();
            }).catch(done);
        });
    });

    it('Should not delete a song if an id belonging to another user is submitted', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/songs/delete')
            .set(headers)
            .send({ id: 1 })
            .then(res => {
              expect(res.body.data).to.be.an('object').that.contains({ deleted: 0 });
              return request(app).get('/songs').set(headers);
            }).then(res => {
              expect(res.body.data).to.be.an('object')
                .that.has.property('tables')
                .that.has.property('songs')
                .that.has.length(16);
              done();
            }).catch(done);
        });
    });
  });
}


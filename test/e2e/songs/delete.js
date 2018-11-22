const _ = require('lodash');
const { login, setupServer } = require('../../utils');

module.exports = function(routes) {
  describe('/songs/delete', () => {
    let app;

    after(function() {
      routes.push('/songs/delete');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .post('/songs/delete')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    // it('Should delete a song if valid id is submitted', (done) => {
    //   login(app)
    //     .then(headers => {
    //       request(app)
    //         .get('/admin/list/User/deep')
    //         .set(headers)
    //         .then(res => {
    //           expect(res.statusCode).to.equal(200);
    //           expect(res.body.records[0])
    //             .to.be.an('object')
    //             .that.has.property('songs')
    //             .that.is.an('array')
    //             .with.length(16);
    //           const song = res.body.records[0].songs.pop();
    //           return request(app)
    //             .post('/songs/delete')
    //             .set(headers)
    //             .send({ id: song.id });
    //         })
    //         .then(res => {
    //           expect(res.body).to.be.an('object').that.contains({ deleted: 1 });
    //           return request(app)
    //             .get('/admin/list/User/deep')
    //             .set(headers);
    //         })
    //         .then(res => {
    //           expect(res.body.records[0]).to.be.an('object')
    //             .that.has.property('songs')
    //             .that.has.length(15);
    //           done();
    //         })
    //         .catch(done);
    //     });
    // });

    // it('Should not delete a song if an invalid id is submitted', (done) => {
    //   login(app)
    //     .then(headers => {
    //       request(app)
    //         .post('/songs/delete')
    //         .set(headers)
    //         .send({ id: 'BADID' })
    //         .then(res => {
    //           expect(res.body).to.be.an('object').that.contains({ deleted: 0 });
    //           return request(app)
    //             .get('/admin/list/User/deep')
    //             .set(headers);
    //         })
    //         .then(res => {
    //           expect(res.body.records[0]).to.be.an('object')
    //             .that.has.property('songs')
    //             .that.has.length(16);
    //           done();
    //         })
    //         .catch(done);
    //     });
    // });

    // it('Should return AuthLockError with code 401 when deleting song assigned to another user if not admin', (done) => {
    //   login(app)
    //     .then(headers => (
    //       request(app)
    //         .get('/admin/list/Song')
    //         .set(headers)
    //         .then(res => {
    //           const songUpdate = _.find(res.body.records, { user: '30000000-0000-0000-0000-000000000002' });
    //           return request(app)
    //             .post('/songs/delete')
    //             .set(headers)
    //             .send({ id: songUpdate.id });
    //         })
    //         .then(res => {
    //           expect(res.statusCode).to.equal(401);
    //           expect(res.body.error).to.be.an('object').that.keys(['name', 'message', 'status']);
    //           expect(res.body.error.name).to.equal('AuthLockError');
    //           done();
    //         })
    //         .catch(done)
    //     ));
    // });
    //
    it('Should not delete a song if an id belonging to another user is submitted with non-admin role', (done) => {
      login(app)
        .then(headers => (
          request(app)
            .get('/admin/list/Song')
            .set(headers)
            .then(res => {
              const songUpdate = _.find(res.body.records, { user: '30000000-0000-0000-0000-000000000002' });
              return request(app)
                .post('/songs/delete')
                .set(headers)
                .send({ id: songUpdate.id });
            })
            .then(res => (
              request(app)
                .get('/admin/list/Song')
                .set(headers)
            ))
            .then(res => {
              expect(res.body.records).to.be.an('array').that.has.length(17);
              done();
            })
            .catch(done)
        ));
    });
  });
};

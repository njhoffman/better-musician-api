const { login, setupServer } = require('../../utils');

module.exports = function SongsEmptyE2E(routes) {
  describe('/songs/empty', () => {
    let app;

    after(function() {
      routes.push('/songs/empty');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

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
            .set(headers)
            .get('/songs/empty')
            .then(res => {
              expect(res.statusCode).to.equal(200);
              done();
            })
            .catch(done);
        });
    });
  });
};

//       return request(app)
//         .get('/songs')
//         .set(headers);
//     })
//     .then(res => {
//       expect(res.statusCode).to.equal(200);
//       expect(res.body.records).to.be.an('array').with.length(1);
//       expect(res.body.records[0]).to.be.an('object')
//         .that.has.property('songs')
//         .that.is.an('array')
//         .with.length(0);
//     })
//     .catch(done);
// });

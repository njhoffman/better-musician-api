const { login, logout, setupServer } = require('../../utils');

module.exports = function() {
  describe('/fields/delete', () => {
    let app;

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => (app = _app));
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .post('/fields/delete')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
    it('Should delete a field if valid id is submitted', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .get('/admin/list/User/deep')
            .set(headers)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body[0])
                .to.be.an('object')
                .that.has.property('customFields')
                .that.is.an('array')
                .with.length(4);
              const customField = res.body[0].customFields.pop();
              return request(app)
                .post('/fields/delete')
                .set(headers)
                .send({ id: customField.id });
            }).then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.data).to.be.an('object').that.contains({ deleted: 1 });
              return request(app).get('/admin/list/User/deep').set(headers);
            }).then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body[0])
                .to.be.an('object')
                .that.has.property('customFields')
                .that.is.an('array')
                .with.length(3);
              done();
            }).catch(done);
        });
    });

    it('Should not delete a field if an invalid id is submitted', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/fields/delete')
            .set(headers)
            .send({ id: 'BADID' })
            .then(res => {
              expect(res.body.data).to.be.an('object').that.contains({ deleted: 0 });
              return request(app).get('/admin/list/User/deep').set(headers);
            }).then(res => {
              expect(res.body[0]).to.be.an('object')
                .that.has.property('customFields')
                .that.is.an('array')
                .that.has.length(4);
              done();
            }).catch(done);
        });
    });

    it('Should not delete a song if an id belonging to another user is submitted', (done) => {
      login(app)
        .then(headers => {
          request(app)
            .post('/fields/delete')
            .set(headers)
            .send({ id: '5' })
            .then(res => {
              expect(res.body.data).to.be.an('object').that.contains({ deleted: 0 });
              return request(app).get('/admin/list/Field').set(headers);
            }).then(res => {
              expect(res.body).to.be.an('array').that.has.length(5);
              done();
            }).catch(done);
        });
    });
  });
}


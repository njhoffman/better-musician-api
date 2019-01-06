// const { filter } = require('lodash');
const { login, setupServer, getSeedData } = require('../../utils');

module.exports = function(routes) {
  describe('/fields/delete', () => {
    const { fields } = getSeedData();
    let app;

    after(function() {
      routes.push('/fields/delete');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
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
              expect(res.body.records[0])
                .to.be.an('object')
                .that.has.property('userFields')
                .that.is.an('array')
                .with.length(fields.length);

              const userField = res.body.records[0].userFields[0];
              return request(app)
                .post('/fields/delete')
                .set(headers)
                .send({ id: userField.id });
            })
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body).to.be.an('object').that.contains({ deleted: 1 });
              return request(app)
                .get('/admin/list/User/deep')
                .set(headers);
            })
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records[0])
                .to.be.an('object')
                .that.has.property('userFields')
                .that.is.an('array')
                .with.length(fields.length - 1);
              done();
            })
            .catch(done);
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
              expect(res.statusCode).to.equal(200);
              expect(res.body).to.be.an('object').that.contains({ deleted: 0 });
              return request(app)
                .get('/admin/list/User/deep')
                .set(headers);
            })
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records[0]).to.be.an('object')
                .that.has.property('userFields')
                .that.is.an('array')
                .that.has.length(fields.length);
              done();
            })
            .catch(done);
        });
    });
    //
    // it('Should return AuthLockError with code 401 when deleting Field assigned to other user if not admin', (done) => {
    //   login(app)
    //     .then(headers => {
    //       request(app)
    //         .post('/fields/delete')
    //         .set(headers)
    //         .send({ id: '60000000-0000-0000-0000-000000000005' })
    //         .then(res => {
    //           expect(res.statusCode).to.equal(401);
    //           expect(res.body.error).to.be.an('object').that.keys(['name', 'message', 'status']);
    //           expect(res.body.error.name).to.equal('AuthLockError');
    //           done();
    //         })
    //         .catch(done);
    //     });
    // });
    //
    // it('Should not delete a field if an id belonging to another user is submitted with non-admin role', (done) => {
    //   login(app)
    //     .then(headers => {
    //       request(app)
    //         .post('/fields/delete')
    //         .set(headers)
    //         .send({ id: '60000000-0000-0000-0000-000000000005' })
    //         .then(res => (
    //           request(app)
    //             .get('/admin/list/Field')
    //             .set(headers)
    //         ))
    //         .then(res => {
    //           const userFields = filter(res.body.records, { user: headers.uid });
    //           expect(userFields).to.be.an('array').that.has.length(5);
    //           done();
    //         })
    //         .catch(done);
    //     });
    // });
  });
};

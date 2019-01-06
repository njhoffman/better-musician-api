const { filter } = require('lodash');
const { login, setupServer, getSeedData } = require('../../utils');

module.exports = function fieldsAddE2E(routes) {
  describe('/fields/add', () => {
    const { users, fields } = getSeedData();
    const userFields = filter(fields, { user: users[0].id });
    let app;

    after(function() {
      routes.push('/fields/add');
    });

    beforeEach(function() {
      this.timeout(10000);
      return setupServer()
        .then(_app => { app = _app; });
    });

    it('Should return 401 if not authenticated', (done) => {
      request(app)
        .post('/fields/add')
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });

    it('Should add a field if required fields exist', (done) => {
      const mockField = { typeId: 0, label: 'Mock Label' };
      login(app)
        .then(headers => {
          request(app)
            .post('/fields/add')
            .set(headers)
            .send(mockField)
            .then(res => {
              expect(res.statusCode).to.equal(200);
              expect(res.body.records).to.be.an('array').with.length(1);
              expect(res.body.records[0]).to.be.an('object').that.contains.keys(['user', 'id', 'typeId', 'label']);
              expect(res.body.records[0].user).to.not.be.an('object');
              return request(app).get('/admin/list/Field');
            })
            .then((res, err) => {
              expect(res.statusCode).to.equal(200);
              const retUserFields = filter(res.body.records, { user: headers.uid });
              expect(retUserFields).to.be.an('array').with.length(userFields.length + 1);
              done(err);
            })
            .catch(done);
        });
    });
  });
};

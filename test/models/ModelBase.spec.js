
// describe('Models', () => {
//   describe('ModelBase', () => {
//     const getDbModuleStub = sinon.stub().returns({ conn: 'test_conn', db: 'test_db' });
//     const ModelBase = proxyquire(
//       '../lib/models/ModelBase', {
//         '../lib/utils/db' : { getDbModule : getDbModuleStub }
//       }
//     );
//
//
//     describe('Static Methods', () => {
//       describe('get db',  () => {
//         it('should invoke getDbModule and return db object', () => {
//         });
//         it('should not suck a dick', () => {
//           expect(true).to.be.true;
//         });
//       });
//       describe('get conn', () => { });
//       describe('get count', () => { });
//       describe('get all', () => { });
//       describe('findById', () => { });
//       describe('modelById', () => { });
//       describe('findByField', () => { });
//       describe('modelByField', () => { });
//       describe('generate', () => { });
//       describe('empty', () => { });
//       describe('reset', () => { });
//     });
//     describe('Instance Methods', () => {
//       describe('constructor', () => { });
//       describe('delete', () => { });
//       describe('update', () => { });
//       describe('add', () => { });
//     });
//   });
// });

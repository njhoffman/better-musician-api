// test user must always exist for tests to pass

const exampleUsers = [{
  email: 'testuser@example.com',
  password: 'dummypassword',
  roles: ['test', 'user', 'admin'],
  refId: 0
}, {
  email: 'user2@example.com',
  roles: ['user'],
  password: 'dummypassword',
  refId: 1
}, {
  email: 'user3@example.com',
  roles: ['admin'],
  password: 'dummypassword',
  refId: 2
}];

module.exports = exampleUsers;

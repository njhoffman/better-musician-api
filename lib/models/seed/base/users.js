// test user must always exist for tests to pass

const exampleUsers = [{
  id: '30000000-0000-0000-0000-000000000000',
  email: 'testuser@example.com',
  password: 'dummypassword',
  roles: ['test', 'user', 'admin'],
  updatedAt: []
}, {
  id: '30000000-0000-0000-0000-000000000001',
  email: 'user2@example.com',
  roles: ['user'],
  password: 'dummypassword',
  updatedAt: []
}, {
  id: '30000000-0000-0000-0000-000000000002',
  email: 'user3@example.com',
  roles: ['admin'],
  password: 'dummypassword',
  updatedAt: []
}];

export default exampleUsers;

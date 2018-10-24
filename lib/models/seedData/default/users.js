// test user must always exist for tests to pass
const exampleUsers = [{
  id: "0",
  email: 'testuser@example.com',
  password: 'dummypassword',
  roles: ['user', 'admin'],
  updatedAt: []
}, {
  id: "1",
  email: 'user2@example.com',
  roles: ['user'],
  password: 'dummypassword',
  updatedAt: []
}, {
  id: "2",
  email: 'user3@example.com',
  roles: ['user'],
  password: 'dummypassword',
  updatedAt: []
}];

export default exampleUsers;

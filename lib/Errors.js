class AuthLockError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthLockError';
    this.status = 401;
  }
}

module.exports = {
  AuthLockError
};

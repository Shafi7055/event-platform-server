const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { signAccessToken } = require('../lib/tokens');

test('signs an access token with the requested claims and expiry', () => {
  const token = signAccessToken({ id: 'user-1' }, 'test-secret', '1h');

  assert.equal(jwt.verify(token, 'test-secret').id, 'user-1');
  assert.equal(jwt.decode(token).exp - jwt.decode(token).iat, 3600);
});

test('rejects invalid signing inputs rather than producing a token', () => {
  assert.throws(() => signAccessToken({ id: 'user-1' }, ''), /JWT_SECRET/);
  assert.throws(() => signAccessToken([], 'test-secret'), /payload/);
  assert.throws(() => signAccessToken({ id: 'user-1' }, 'test-secret', ''), /expiration/);
});

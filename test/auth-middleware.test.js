const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createVerifyToken } = require('../lib/auth-middleware');

function invoke(middleware, { authorization, cookie } = {}) {
  const req = { headers: {}, cookies: {} };
  if (authorization !== undefined) req.headers.authorization = authorization;
  if (cookie !== undefined) req.cookies.token = cookie;

  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

test('accepts a valid Bearer token and attaches its claims', async () => {
  const token = jwt.sign({ id: 'user-1' }, 'test-secret');
  const result = invoke(createVerifyToken(() => 'test-secret'), {
    authorization: `Bearer ${token}`,
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.user.id, 'user-1');
});

test('rejects malformed authorization headers without falling back to cookies', () => {
  const result = invoke(createVerifyToken(() => 'test-secret'), {
    authorization: 'Basic token',
    cookie: 'valid-cookie-token',
  });

  assert.equal(result.res.statusCode, 401);
  assert.equal(result.res.body.message, 'Invalid authorization header');
});

test('rejects missing and invalid credentials and reports missing server configuration', async () => {
  const verify = createVerifyToken(() => 'test-secret');
  assert.equal(invoke(verify).res.statusCode, 401);
  assert.equal(invoke(createVerifyToken(() => ''), {
    authorization: 'Bearer token',
  }).res.statusCode, 500);

  const invalid = invoke(verify, { authorization: 'Bearer invalid' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(invalid.res.statusCode, 403);
});

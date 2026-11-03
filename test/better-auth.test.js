const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createSessionTokenHandler } = require('../lib/better-auth');

const config = {
  jwtSecret: 'test-jwt-secret',
  jwtExpiresIn: '7d',
};

function createResponse() {
  return {
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
}

test('exchanges a Better Auth session for the API JWT contract', async () => {
  const expectedHeaders = { cookie: 'better-auth-session=valid' };
  const integration = {
    auth: {
      api: {
        getSession: async ({ headers }) => {
          assert.deepEqual(headers, expectedHeaders);
          return {
            user: {
              id: 'user-123',
              name: 'Good Neighbor',
              email: 'neighbor@example.com',
              image: null,
            },
          };
        },
      },
    },
    fromNodeHeaders: (headers) => headers,
  };
  const response = createResponse();

  await createSessionTokenHandler(integration, config)(
    { headers: expectedHeaders },
    response,
    assert.fail,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.user, {
    id: 'user-123',
    name: 'Good Neighbor',
    email: 'neighbor@example.com',
    image: '',
  });
  const claims = jwt.verify(response.body.token, config.jwtSecret);
  assert.equal(claims.id, 'user-123');
  assert.equal(claims.name, 'Good Neighbor');
  assert.equal(claims.email, 'neighbor@example.com');
  assert.equal(claims.image, '');
  assert.equal(typeof claims.iat, 'number');
  assert.equal(typeof claims.exp, 'number');
});

test('rejects token exchange without a Better Auth session', async () => {
  const integration = {
    auth: { api: { getSession: async () => null } },
    fromNodeHeaders: () => new Headers(),
  };
  const response = createResponse();

  await createSessionTokenHandler(integration, config)({ headers: {} }, response, assert.fail);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { message: 'A signed-in session is required.' });
});

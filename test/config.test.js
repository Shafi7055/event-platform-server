const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../lib/config');

const validEnv = {
  MONGODB_URI: 'mongodb://localhost:27017/events',
  JWT_SECRET: 'test-secret',
  BETTER_AUTH_SECRET: 'a-test-secret-that-is-at-least-thirty-two-characters',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
};

test('loads validated runtime settings and safe defaults', () => {
  assert.deepEqual(loadConfig(validEnv), {
    port: 8000,
    mongodbUri: validEnv.MONGODB_URI,
    jwtSecret: validEnv.JWT_SECRET,
    jwtExpiresIn: '7d',
    betterAuthSecret: validEnv.BETTER_AUTH_SECRET,
    betterAuthUrl: 'http://localhost:8000',
    googleClientId: validEnv.GOOGLE_CLIENT_ID,
    googleClientSecret: validEnv.GOOGLE_CLIENT_SECRET,
    clientOrigin: 'http://localhost:3000',
    isProduction: false,
  });
});

test('reports every missing required setting', () => {
  assert.throws(
    () => loadConfig({}),
    /MONGODB_URI, JWT_SECRET, BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET/,
  );
});

test('rejects invalid ports and non-web client origins', () => {
  assert.throws(() => loadConfig({ ...validEnv, PORT: '70000' }), /PORT/);
  assert.throws(() => loadConfig({ ...validEnv, CLIENT_ORIGIN: 'file:///tmp/client' }), /HTTP or HTTPS/);
  assert.throws(
    () => loadConfig({ ...validEnv, BETTER_AUTH_SECRET: 'short' }),
    /at least 32 characters/,
  );
  assert.throws(
    () => loadConfig({ ...validEnv, BETTER_AUTH_URL: 'https://auth.example.com/path' }),
    /without a path/,
  );
  assert.throws(
    () => loadConfig({ ...validEnv, NODE_ENV: 'production' }),
    /BETTER_AUTH_URL must be set in production/,
  );
});

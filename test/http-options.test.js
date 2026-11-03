const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getCorsOptions,
  getJsonOptions,
  getSessionCookieOptions,
} = require('../lib/http-options');

test('restricts credentialed CORS to the configured client origin', () => {
  assert.deepEqual(getCorsOptions({ clientOrigin: 'https://client.example', isProduction: true }), {
    origin: 'https://client.example',
    credentials: true,
  });
});

test('keeps auth cookies HTTP-only and secure in production', () => {
  assert.deepEqual(getSessionCookieOptions({ isProduction: true }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
  });
  assert.equal(getSessionCookieOptions({ isProduction: false }).secure, false);
});

test('limits JSON request bodies', () => {
  assert.deepEqual(getJsonOptions(), { limit: '1mb' });
});

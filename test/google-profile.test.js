const test = require('node:test');
const assert = require('node:assert/strict');
const { mapGoogleProfile } = require('../lib/google-profile');

test('maps Google identity data into normalized application claims', () => {
  assert.deepEqual(mapGoogleProfile({
    id: 'google-123',
    emails: [{ value: 'Person@Example.com' }],
    displayName: 'Example Person',
    photos: [{ value: 'https://example.com/avatar.png' }],
  }), {
    id: 'google-123',
    email: 'person@example.com',
    name: 'Example Person',
    photo: 'https://example.com/avatar.png',
  });
});

test('rejects profiles without an account ID or usable email', () => {
  assert.throws(() => mapGoogleProfile({ emails: [{ value: 'user@example.com' }] }), /account ID/);
  assert.throws(() => mapGoogleProfile({ id: 'google-123', emails: [] }), /email address/);
});

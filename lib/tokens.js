const jwt = require('jsonwebtoken');

function signAccessToken(payload, secret, expiresIn = '7d') {
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('JWT_SECRET is required to sign access tokens');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Token payload must be an object');
  }
  if (!expiresIn) {
    throw new Error('Token expiration is required');
  }

  return jwt.sign(payload, secret, { expiresIn });
}

module.exports = { signAccessToken };

const DEFAULT_PORT = 3000;

function loadConfig(env = process.env) {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missing = required.filter((name) => !env[name]?.trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const port = Number(env.PORT || DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const clientOrigin = env.CLIENT_ORIGIN || env.CORS_ORIGIN || 'http://localhost:3000';
  let parsedOrigin;
  try {
    parsedOrigin = new URL(clientOrigin);
  } catch {
    throw new Error('CLIENT_ORIGIN must be a valid absolute URL');
  }
  if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
    throw new Error('CLIENT_ORIGIN must use HTTP or HTTPS');
  }

  return {
    port,
    mongodbUri: env.MONGODB_URI,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: env.GOOGLE_CALLBACK_URL || `http://localhost:${port}/auth/google/callback`,
    clientOrigin: parsedOrigin.origin,
    isProduction: env.NODE_ENV === 'production',
  };
}

module.exports = { loadConfig };

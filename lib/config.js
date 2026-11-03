const DEFAULT_PORT = 8000;

function loadConfig(env = process.env) {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'BETTER_AUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  const missing = required.filter((name) => !env[name]?.trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters long');
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

  const betterAuthUrl = env.BETTER_AUTH_URL || `http://localhost:${port}`;
  let parsedAuthUrl;
  try {
    parsedAuthUrl = new URL(betterAuthUrl);
  } catch {
    throw new Error('BETTER_AUTH_URL must be a valid absolute URL');
  }
  if (
    !['http:', 'https:'].includes(parsedAuthUrl.protocol) ||
    parsedAuthUrl.pathname !== '/' ||
    parsedAuthUrl.search ||
    parsedAuthUrl.hash
  ) {
    throw new Error('BETTER_AUTH_URL must be an HTTP(S) origin without a path');
  }
  if (env.NODE_ENV === 'production' && !env.BETTER_AUTH_URL) {
    throw new Error('BETTER_AUTH_URL must be set in production');
  }

  return {
    port,
    mongodbUri: env.MONGODB_URI,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: parsedAuthUrl.origin,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    clientOrigin: parsedOrigin.origin,
    isProduction: env.NODE_ENV === 'production',
  };
}

module.exports = { loadConfig };

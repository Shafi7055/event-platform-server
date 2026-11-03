function getCorsOptions(config) {
  return {
    origin: config.clientOrigin,
    credentials: true,
  };
}

function getSessionCookieOptions(config) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  };
}

function getJsonOptions() {
  return { limit: '1mb' };
}

module.exports = { getCorsOptions, getSessionCookieOptions, getJsonOptions };

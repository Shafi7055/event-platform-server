const { signAccessToken } = require('./tokens');

async function createBetterAuth({ database, config }) {
  const [{ betterAuth }, { mongodbAdapter }, { fromNodeHeaders, toNodeHandler }] =
    await Promise.all([
      import('better-auth'),
      import('better-auth/adapters/mongodb'),
      import('better-auth/node'),
    ]);

  const auth = betterAuth({
    appName: 'Goodneighbor',
    baseURL: config.betterAuthUrl,
    secret: config.betterAuthSecret,
    database: mongodbAdapter(database),
    trustedOrigins: [config.clientOrigin],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: config.isProduction ? 'none' : 'lax',
        secure: config.isProduction,
        httpOnly: true,
        path: '/',
      },
    },
  });

  return {
    auth,
    fromNodeHeaders,
    handler: toNodeHandler(auth),
  };
}

function createSessionTokenHandler(authIntegration, config) {
  return async function sessionTokenHandler(req, res, next) {
    try {
      const session = await authIntegration.auth.api.getSession({
        headers: authIntegration.fromNodeHeaders(req.headers),
      });

      if (!session) {
        return res.status(401).json({ message: 'A signed-in session is required.' });
      }

      const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image || '',
      };
      const token = signAccessToken(user, config.jwtSecret, config.jwtExpiresIn);

      return res.json({ user, token });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { createBetterAuth, createSessionTokenHandler };

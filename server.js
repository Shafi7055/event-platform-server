
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { loadConfig } = require('./lib/config');
const { createVerifyToken } = require('./lib/auth-middleware');
const { createErrorHandler } = require('./lib/error-handler');
const { mapGoogleProfile } = require('./lib/google-profile');
const { getCorsOptions, getJsonOptions, getSessionCookieOptions } = require('./lib/http-options');
const { registerShutdownHandlers, startAfterReady } = require('./lib/lifecycle');
const { signAccessToken } = require('./lib/tokens');

const config = loadConfig();
const app = express();

// Middleware
app.use(cors(getCorsOptions(config)));
app.use(express.json(getJsonOptions()));
app.use(cookieParser());
app.use(passport.initialize());

// MongoDB connection
let databaseIsReady = false;
const databaseReady = mongoose.connect(config.mongodbUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    databaseIsReady = true;
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  });

// JWT verification middleware (for protected routes)
const verifyToken = createVerifyToken(() => config.jwtSecret);

// Passport Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallbackUrl,
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        return done(null, mapGoogleProfile(profile));
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize/deserialize (simple version)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  // In a real app, fetch user from DB. Here we just pass id.
  done(null, { id });
});

// Auth routes
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    // Successful auth – issue JWT and send to client (as cookie & JSON)
    const payload = { email: req.user.email, name: req.user.name, id: req.user.id };
    const token = signAccessToken(payload, config.jwtSecret, config.jwtExpiresIn);
    // Set httpOnly cookie
    res.cookie('token', token, getSessionCookieOptions(config));
    // Redirect to client app (example)
    res.redirect(config.clientOrigin);
  }
);

// Sample protected route example
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'You have access', user: req.user });
});

// Liveness and readiness checks
app.get('/health', (req, res) => res.send('OK'));
app.get('/ready', (req, res) => {
  if (!databaseIsReady) return res.status(503).json({ status: 'not ready' });
  return res.json({ status: 'ready' });
});
app.use(createErrorHandler());

startAfterReady(databaseReady, () => {
  const server = app.listen(config.port, () => {
    console.log(`🚀 Server listening on http://localhost:${config.port}`);
  });
  registerShutdownHandlers({
    server,
    closeDatabase: () => mongoose.disconnect(),
  });
}).catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exitCode = 1;
});


require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// JWT verification middleware (for protected routes)
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Access token missing' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = decoded; // contains at least email and uid
    next();
  });
}

// Passport Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // Here you would find or create the user in DB. For now, just pass profile.
      const user = {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        photo: profile.photos?.[0]?.value,
      };
      return done(null, user);
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
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    // Set httpOnly cookie
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    // Redirect to client app (example)
    res.redirect('http://localhost:3000');
  }
);

// Sample protected route example
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'You have access', user: req.user });
});

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

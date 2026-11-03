
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { loadConfig } = require('./lib/config');
const { createVerifyToken } = require('./lib/auth-middleware');
const { createErrorHandler } = require('./lib/error-handler');
const { getCorsOptions, getJsonOptions } = require('./lib/http-options');
const { registerShutdownHandlers, startAfterReady } = require('./lib/lifecycle');

const config = loadConfig();
const app = express();

app.use(cors(getCorsOptions(config)));

const client = new MongoClient(config.mongodbUri);
let databaseIsReady = false;
const serverReady = client.connect()
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    global.db = client.db();
    databaseIsReady = true;
    const { createBetterAuth, createSessionTokenHandler } = require('./lib/better-auth');
    const authIntegration = await createBetterAuth({ database: client.db(), config });

    app.use(cookieParser());
    const verifyToken = createVerifyToken(() => config.jwtSecret);
    app.post('/api/auth/token', createSessionTokenHandler(authIntegration, config));
    app.get('/api/auth/me', verifyToken, (req, res) => {
      res.json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          image: req.user.image || '',
        },
      });
    });
    app.all('/api/auth/*splat', authIntegration.handler);
    app.use(express.json(getJsonOptions()));

    app.get('/api/protected', verifyToken, (req, res) => {
      res.json({ message: 'You have access', user: req.user });
    });
    app.get('/health', (req, res) => res.send('OK'));
    app.get('/ready', (req, res) => {
      if (!databaseIsReady) return res.status(503).json({ status: 'not ready' });
      return res.json({ status: 'ready' });
    });
    app.use(createErrorHandler());
  });

startAfterReady(serverReady, () => {
  const server = app.listen(config.port, () => {
    console.log(`🚀 Server listening on http://localhost:${config.port}`);
  });
  registerShutdownHandlers({
    server,
    closeDatabase: () => client.close(),
  });
}).catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exitCode = 1;
});

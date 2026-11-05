# Event Platform Server

Backend service for the Goodneighbor event platform. This repository currently provides the Express server foundation, MongoDB connection, authentication, and health/readiness endpoints.

## Features

- Express 5 API server with configurable CORS.
- MongoDB connection and startup/readiness handling.
- Email/password and Google sign-in through [Better Auth](https://www.better-auth.com/).
- JWT access-token issuance for signed-in sessions.
- Protected user/session endpoints.
- Graceful shutdown and centralized error handling.
- Automated tests using Node.js's built-in test runner.

> Event-management endpoints (such as creating or listing events) are not currently exposed by `server.js`.

## Requirements

- Node.js (20 or later recommended)
- npm
- MongoDB instance (local or hosted)
- Google OAuth credentials for Google sign-in

## Getting started

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Shafi7055/event-platform-server.git
   cd event-platform-server
   npm install
   ```

2. Create a local environment file from the example:

   ```bash
   cp .env.example .env
   ```

3. Set the required values in `.env`:

   | Variable | Purpose |
   | --- | --- |
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_SECRET` | Secret used to sign access tokens; use a long, random value |
   | `BETTER_AUTH_SECRET` | Better Auth secret (at least 32 characters) |
   | `BETTER_AUTH_URL` | Server's absolute HTTP(S) origin, e.g. `http://localhost:8000` |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
   | `PORT` | Port to listen on (defaults to `8000`) |
   | `JWT_EXPIRES_IN` | Access-token lifetime (defaults to `7d`) |
   | `CLIENT_ORIGIN` | Frontend origin allowed by CORS (defaults to `http://localhost:3000`) |

   Generate a Better Auth secret with:

   ```bash
   openssl rand -base64 32
   ```

4. In your Google OAuth client settings, add this authorized redirect URI:

   ```text
   http://localhost:8000/api/auth/callback/google
   ```

   For deployment, use the matching HTTPS server URL and configure `BETTER_AUTH_URL` and the OAuth redirect URI accordingly.

5. Start the server:

   ```bash
   npm start
   ```

The API will be available at `http://localhost:8000` (or the configured `PORT`). The server connects to MongoDB before it begins listening.

## API endpoints

| Method | Path | Description | Authentication |
| --- | --- | --- | --- |
| `GET` | `/health` | Basic process health check (`OK`) | None |
| `GET` | `/ready` | Readiness check; returns `503` until MongoDB is ready | None |
| `POST` | `/api/auth/token` | Exchange a signed-in Better Auth session for a JWT access token | Better Auth session required |
| `GET` | `/api/auth/me` | Return the current authenticated user's profile | JWT required |
| `GET` | `/api/protected` | Example protected route | JWT required |
| `*` | `/api/auth/*` | Better Auth endpoints, including sign-in and OAuth callbacks | Varies by endpoint |

### Using a JWT-protected route

After obtaining the token from `POST /api/auth/token`, include it as a bearer token:

```http
GET /api/protected
Authorization: Bearer <access-token>
```

The token endpoint returns a JSON response containing `user` and `token`. The server also accepts a token from the `token` cookie on protected routes.

## Development and tests

Run the test suite with:

```bash
npm test
```

Run the server in development with:

```bash
npm start
```

## Configuration notes

- `BETTER_AUTH_SECRET` must be at least 32 characters.
- `BETTER_AUTH_URL` must be an HTTP(S) origin without a path. Set it explicitly in production.
- Set `CLIENT_ORIGIN` to the exact origin of the frontend application.
- Keep `.env` and all credentials out of version control; use your hosting provider's secret manager in production.

## License

This project declares the ISC license in `package.json`.

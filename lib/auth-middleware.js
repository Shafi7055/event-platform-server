const jwt = require('jsonwebtoken');

function createVerifyToken(secretProvider = () => process.env.JWT_SECRET) {
  return function verifyToken(req, res, next) {
    const authorization = req.headers?.authorization;
    let token;

    if (authorization !== undefined) {
      const match = /^Bearer\s+(\S+)$/i.exec(authorization);
      if (!match) {
        return res.status(401).json({ message: 'Invalid authorization header' });
      }
      token = match[1];
    } else if (typeof req.cookies?.token === 'string' && req.cookies.token.length > 0) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access token missing' });
    }

    const secret = secretProvider();
    if (typeof secret !== 'string' || secret.length === 0) {
      return res.status(500).json({ message: 'Authentication is not configured' });
    }

    jwt.verify(token, secret, (error, decoded) => {
      if (error || !decoded || typeof decoded !== 'object') {
        return res.status(403).json({ message: 'Invalid token' });
      }
      req.user = decoded;
      return next();
    });
  };
}

module.exports = { createVerifyToken };

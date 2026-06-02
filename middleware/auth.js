'use strict';
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'acadhr_secret_2025';

/**
 * auth(roles?) — JWT authentication middleware
 * Pass roles array to restrict access e.g. auth(['admin','teacher'])
 */
function auth(roles = []) {
  return (req, res, next) => {
    const header = req.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token provided.' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied.' });
      }
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
  };
}

module.exports = auth;

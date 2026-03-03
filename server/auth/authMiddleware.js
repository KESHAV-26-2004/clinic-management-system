// server/auth/authMiddleware.js
const { verifyToken } = require('./tokenService');
const db = require('../db');

function requireAuth(requiredRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token =
      authHeader.replace('Bearer ', '') || req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const payload = verifyToken(token);

      // 🔐 CHECK USER EXISTS & ACTIVE
      const dbUser = db.prepare(`
        SELECT is_active, password_changed_at
        FROM users
        WHERE id = ?
      `).get(payload.userId);

      if (!dbUser || dbUser.is_active === 0) {
        return res
          .status(403)
          .json({ error: 'User disabled' });
      }

      // 🔐 FORCE LOGOUT IF PASSWORD CHANGED AFTER TOKEN ISSUED
      if (
        dbUser.password_changed_at &&
        payload.iat * 1000 <
          new Date(dbUser.password_changed_at).getTime()
      ) {
        return res.status(401).json({
          error: 'Session expired. Please login again.',
        });
      }

      // 🔐 ROLE CHECK
      if (
        requiredRoles.length &&
        !requiredRoles.includes(payload.role)
      ) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

function blockRemoteWrite(req, res, next) {
  if (req.user.accessMode === 'REMOTE') {
    return res
      .status(403)
      .json({ error: 'Read-only in remote mode' });
  }
  next();
}

module.exports = {
  requireAuth,
  blockRemoteWrite,
};

// JWT auth middleware.
// Expects header:  Authorization: Bearer <token>

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'kds-dev-secret-change-me';
const TOKEN_TTL = '12h';

function sign(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role, username: user.username },
    SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function verify(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

module.exports = { sign, verify, requireRole, SECRET };

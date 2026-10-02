// JWT auth middleware.
// Expects header:  Authorization: Bearer <token>

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Previously this fell back to the literal string "kds-dev-secret-change-me",
// which meant that anyone who cloned this repo could mint a token with
// role=admin and every request accepted it. The demo app is public, so that
// was a live admin bypass, not a theoretical one.
//
// Rule now: a real secret is mandatory outside development. In development we
// still refuse to fall back to a guessable constant, we just generate a random
// one per boot so `npm run dev` keeps working without a .env.
const isProd = process.env.NODE_ENV === 'production';

let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  if (isProd) {
    throw new Error(
      'JWT_SECRET is not set. Refusing to start in production with a guessable signing key. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
  SECRET = crypto.randomBytes(48).toString('hex');
  console.warn(
    '[auth] JWT_SECRET not set. Generated an ephemeral random secret for this process only. ' +
    'All tokens die on restart. Set JWT_SECRET in server/.env to keep sessions alive.'
  );
}

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

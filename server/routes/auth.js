// Auth routes - POST /login, POST /signup, GET /me

const express = require('express');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const db = require('../db');
const { sign, verify } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'missing_credentials' });

  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const user = { id: row.id, name: row.name, username: row.username, role: row.role };
  const token = sign(user);
  res.json({ token, user });
});

// Public signup.
//
// The first account on a fresh database becomes admin so a new deployment is
// usable without a console. Every later signup is a staff account and can only
// pick server or kitchen.
//
// This used to honour the role field straight from the request body, so anyone
// who could reach /api/auth/signup could post role:"admin" and get an admin
// token. On the public demo that was one POST away from owning the app.
const PUBLIC_ROLES = ['server', 'kitchen'];

router.post('/signup', (req, res) => {
  const { name, username, password, role } = req.body || {};

  if (typeof name !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const cleanName = name.trim();
  const cleanUser = username.trim().toLowerCase();

  if (!cleanName || !cleanUser || !password) return res.status(400).json({ error: 'missing_fields' });
  if (cleanUser.length > 64) return res.status(400).json({ error: 'username_too_long' });
  if (!/^[a-z0-9._-]+$/.test(cleanUser)) {
    return res.status(400).json({ error: 'bad_username', hint: 'letters, numbers, dot, dash, underscore' });
  }
  if (password.length < 8) return res.status(400).json({ error: 'weak_password' });

  const requested = PUBLIC_ROLES.includes(role) ? role : 'server';
  const isFirstUser = db.prepare('SELECT COUNT(*) AS c FROM users').get().c === 0;
  const roleToUse = isFirstUser ? 'admin' : requested;

  // Check uniqueness on the NORMALISED username. This used to compare the raw
  // field, so "  Zham " passed the check and then blew up on the UNIQUE index
  // as an unhandled 500.
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUser);
  if (existing) return res.status(409).json({ error: 'username_taken' });

  const id = 'u_' + nanoid(10);
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare(
      'INSERT INTO users (id, name, username, password_hash, role) VALUES (?,?,?,?,?)'
    ).run(id, cleanName, cleanUser, hash, roleToUse);
  } catch (e) {
    // Lost a signup race against a concurrent request for the same username.
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'username_taken' });
    }
    throw e;
  }

  const user = { id, name: cleanName, username: cleanUser, role: roleToUse };
  const token = sign(user);
  res.status(201).json({ token, user });
});

router.get('/me', verify, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
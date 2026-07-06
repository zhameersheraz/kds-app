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

// Open signup. Anyone can create an account; they pick the role.
// The first account is auto-promoted to admin (handled below).
router.post('/signup', (req, res) => {
  const { name, username, password, role } = req.body || {};
  if (!name || !username || !password) return res.status(400).json({ error: 'missing_fields' });
  if (password.length < 8) return res.status(400).json({ error: 'weak_password' });

  const allowedRoles = ['server', 'kitchen', 'admin'];
  const finalRole = allowedRoles.includes(role) ? role : 'server';

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'username_taken' });

  // First user becomes admin automatically so a fresh deployment is usable.
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const roleToUse = userCount === 0 ? 'admin' : finalRole;

  const id = 'u_' + nanoid(10);
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, name, username, password_hash, role) VALUES (?,?,?,?,?)'
  ).run(id, name.trim(), username.trim().toLowerCase(), hash, roleToUse);

  const user = { id, name: name.trim(), username: username.trim().toLowerCase(), role: roleToUse };
  const token = sign(user);
  res.status(201).json({ token, user });
});

router.get('/me', verify, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
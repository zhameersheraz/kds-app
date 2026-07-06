// Menu routes — read for everyone, write for admin.

const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { verify, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', verify, (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM menu_items ORDER BY category, name')
    .all();
  res.json(rows);
});

router.post('/', verify, requireRole('admin'), (req, res) => {
  const { name, category, price, description } = req.body || {};
  if (!name || !category || typeof price !== 'number')
    return res.status(400).json({ error: 'missing_fields' });
  const id = 'm_' + nanoid(8);
  db.prepare(
    `INSERT INTO menu_items (id, name, category, price, description)
     VALUES (?,?,?,?,?)`
  ).run(id, name, category, price, description || null);
  res.status(201).json(db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id));
});

router.patch('/:id', verify, requireRole('admin'), (req, res) => {
  const { name, category, price, description, available } = req.body || {};
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  db.prepare(
    `UPDATE menu_items
     SET name = COALESCE(?, name),
         category = COALESCE(?, category),
         price = COALESCE(?, price),
         description = COALESCE(?, description),
         available = COALESCE(?, available)
     WHERE id = ?`
  ).run(
    name ?? null,
    category ?? null,
    typeof price === 'number' ? price : null,
    description ?? null,
    typeof available === 'number' ? available : null,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id));
});

router.delete('/:id', verify, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

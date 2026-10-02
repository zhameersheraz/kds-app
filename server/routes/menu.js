// Menu routes — read for everyone, write for admin.

const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { verify, requireRole } = require('../middleware/auth');

const router = express.Router();

function cleanPrice(price) {
  return typeof price === 'number' && Number.isFinite(price) && price >= 0;
}

router.get('/', verify, (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM menu_items ORDER BY category, name')
    .all();
  res.json(rows);
});

router.post('/', verify, requireRole('admin'), (req, res) => {
  const { name, category, price, description } = req.body || {};
  if (!name || !category) return res.status(400).json({ error: 'missing_fields' });
  // `typeof price === 'number'` alone accepted -500 and NaN, which then flowed
  // straight into order totals.
  if (!cleanPrice(price)) return res.status(400).json({ error: 'bad_price' });

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
  if (price !== undefined && !cleanPrice(price)) return res.status(400).json({ error: 'bad_price' });

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
    cleanPrice(price) ? price : null,
    description ?? null,
    // Was any number, so available=5 or available=-3 could be stored. The
    // column is read as a boolean everywhere, so coerce to 0/1.
    typeof available === 'boolean' ? (available ? 1 : 0)
      : typeof available === 'number' ? (available ? 1 : 0)
        : null,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id));
});

router.delete('/:id', verify, requireRole('admin'), (req, res) => {
  // Note: order_items keeps a denormalised copy of name and price and has no
  // foreign key to menu_items, so deleting an item never damages order history.
  const r = db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

module.exports = router;

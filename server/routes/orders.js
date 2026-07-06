// Order routes — create / list / status transitions.
//
// State machine:
//   pending -> preparing -> ready -> served
//   pending -> cancelled  (admin, or the server who created the order)
//   preparing -> cancelled (admin only)
//   any other terminal = no transitions out
//
// Roles (v6.3):
//   server  : create orders, cancel own PENDING orders,
//             mark any `ready` order as `served`
//   kitchen : pending -> preparing, preparing -> ready
//   admin   : any transition, any view
//
// Stale handling:
//   pending orders older than STALE_MINUTES are auto-cancelled (lazy,
//   runs whenever /orders/active or /orders/mine is hit). Keeps the
//   kitchen from drowning in abandoned tickets without admin babysitting.

const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { verify, requireRole } = require('../middleware/auth');

const router = express.Router();

const STALE_MINUTES = parseInt(process.env.STALE_PENDING_MINUTES || '30', 10);

function autoCancelStale() {
  // Anything still 'pending' for over STALE_MINUTES gets cancelled.
  // Runs inside a transaction, touches only orders (no items).
  const tx = db.transaction(() => {
    const due = db.prepare(
      `SELECT id FROM orders
       WHERE status = 'pending'
         AND created_at < datetime('now', ?)`
    ).all(`-${STALE_MINUTES} minutes`);
    if (due.length === 0) return 0;
    const stmt = db.prepare(
      `UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`
    );
    for (const r of due) stmt.run(r.id);
    return due.length;
  });
  const n = tx();
  if (n) console.log(`[orders] auto-cancelled ${n} stale pending order(s) (>${STALE_MINUTES} min)`);
  return n;
}

const VALID_TRANSITIONS = {
  pending:    ['preparing', 'cancelled'],
  preparing:  ['ready', 'cancelled'],
  ready:      ['served'],
  served:     [],
  cancelled:  []
};

function hydrateOrder(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;
  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY rowid')
    .all(orderId);
  return { ...order, items };
}

// POST /orders — create new order (server)
router.post('/', verify, requireRole('server', 'admin'), (req, res) => {
  const { tableNumber, items, notes } = req.body || {};
  if (!tableNumber) return res.status(400).json({ error: 'missing_table' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'empty_order' });

  // Resolve items + prices from menu (server cannot inject prices).
  const ids = items.map((i) => i.menuItemId).filter(Boolean);
  if (ids.length !== items.length) return res.status(400).json({ error: 'bad_items' });

  const menuRows = db
    .prepare(`SELECT id, name, price FROM menu_items WHERE id IN (${ids.map(() => '?').join(',')}) AND available = 1`)
    .all(...ids);
  const menuMap = new Map(menuRows.map((r) => [r.id, r]));

  let total = 0;
  const resolved = [];
  for (const it of items) {
    const m = menuMap.get(it.menuItemId);
    if (!m) return res.status(400).json({ error: 'unknown_item', id: it.menuItemId });
    const qty = Math.max(1, parseInt(it.qty, 10) || 1);
    const linePrice = m.price * qty;
    total += linePrice;
    resolved.push({
      id: 'oi_' + nanoid(10),
      menu_item_id: m.id,
      name: m.name,
      qty,
      price: m.price,
      notes: it.notes || null
    });
  }

  const orderId = 'ord_' + nanoid(10);

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (id, table_number, server_id, server_name, status, total, notes)
       VALUES (?,?,?,?,?,?,?)`
    ).run(
      orderId,
      String(tableNumber),
      req.user.sub,
      req.user.name,
      'pending',
      Math.round(total * 100) / 100,
      notes || null
    );
    const stmt = db.prepare(
      `INSERT INTO order_items (id, order_id, menu_item_id, name, qty, price, notes)
       VALUES (?,?,?,?,?,?,?)`
    );
    for (const r of resolved) {
      stmt.run(r.id, orderId, r.menu_item_id, r.name, r.qty, r.price, r.notes);
    }
  });
  tx();

  const full = hydrateOrder(orderId);
  req.app.locals.broadcast('new_order', full);
  res.status(201).json(full);
});

// GET /orders/active — KDS feed (kitchen + admin)
router.get('/active', verify, requireRole('kitchen', 'admin'), (req, res) => {
  autoCancelStale();
  const rows = db
    .prepare(
      `SELECT * FROM orders WHERE status IN ('pending','preparing','ready')
       ORDER BY created_at ASC`
    )
    .all();
  res.json(rows.map((o) => hydrateOrder(o.id)));
});

// GET /orders/mine — server's own orders, today (server + admin)
router.get('/mine', verify, requireRole('server', 'admin'), (req, res) => {
  autoCancelStale();
  const rows = db
    .prepare(
      `SELECT * FROM orders
       WHERE server_id = ? AND date(created_at) = date('now')
       ORDER BY created_at DESC`
    )
    .all(req.user.sub);
  res.json(rows.map((o) => hydrateOrder(o.id)));
});

// GET /orders/all — full history (admin only) with optional filters
router.get('/all', verify, requireRole('admin'), (req, res) => {
  const { status, limit } = req.query;
  const params = [];
  let sql = 'SELECT * FROM orders WHERE 1=1';
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit, 10) || 200);
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map((o) => hydrateOrder(o.id)));
});

// PATCH /orders/:id/status — state transition
router.patch('/:id/status', verify, (req, res) => {
  const { status: next } = req.body || {};
  const allowed = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
  if (!allowed.includes(next)) return res.status(400).json({ error: 'bad_status' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'not_found' });

  // Role policy
  const role = req.user.role;
  const isOwnServer = order.server_id === req.user.sub;

  // Cancel: admin always, or the original server (only while it's still pending)
  if (next === 'cancelled') {
    const canCancel =
      role === 'admin' ||
      (role === 'server' && isOwnServer && order.status === 'pending');
    if (!canCancel) return res.status(403).json({ error: 'forbidden' });
  }
  // Kitchen steps: kitchen or admin
  if (['preparing', 'ready'].includes(next) && role !== 'kitchen' && role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  // Mark served: any server, or admin, or the server who created it
  if (next === 'served' && !(role === 'server' || role === 'admin') && !isOwnServer) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const allowedNext = VALID_TRANSITIONS[order.status] || [];
  if (!allowedNext.includes(next)) {
    return res.status(409).json({ error: 'invalid_transition', from: order.status, to: next });
  }

  db.prepare(
    `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(next, req.params.id);

  const full = hydrateOrder(req.params.id);
  req.app.locals.broadcast('order_status_update', full);
  res.json(full);
});

module.exports = router;

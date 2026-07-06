// Reports — sales summary + counts (admin only).

const express = require('express');
const db = require('../db');
const { verify, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/sales', verify, requireRole('admin'), (req, res) => {
  // Today's sales by status
  const byStatus = db
    .prepare(
      `SELECT status, COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue
       FROM orders WHERE date(created_at) = date('now')
       GROUP BY status`
    )
    .all();

  // Last 7 days revenue
  const week = db
    .prepare(
      `SELECT date(created_at) AS day,
              COUNT(*) AS orders,
              COALESCE(SUM(total),0) AS revenue
       FROM orders
       WHERE created_at >= datetime('now','-6 days')
       GROUP BY day ORDER BY day ASC`
    )
    .all();

  // Top items today
  const topItems = db
    .prepare(
      `SELECT oi.name,
              SUM(oi.qty) AS qty,
              SUM(oi.qty * oi.price) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE date(o.created_at) = date('now')
       GROUP BY oi.name
       ORDER BY qty DESC
       LIMIT 8`
    )
    .all();

  const totals = byStatus.reduce(
    (acc, r) => {
      acc.orders += r.count;
      acc.revenue += r.status === 'cancelled' ? 0 : r.revenue;
      return acc;
    },
    { orders: 0, revenue: 0 }
  );

  res.json({ byStatus, week, topItems, totals });
});

router.get('/summary', verify, requireRole('admin'), (_req, res) => {
  const counts = db
    .prepare(
      `SELECT status, COUNT(*) AS c FROM orders
       WHERE date(created_at) = date('now')
       GROUP BY status`
    )
    .all();
  res.json(counts);
});

module.exports = router;

// ServerStatus - server's phone view of their active orders.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSocketEvent } from '../lib/useSocketEvent';
import { useCurrency } from '../lib/currency';
import { elapsedLabel } from '../lib/format';
import { printCustomerReceipt } from '../lib/printTicket';
import TopBar from '../components/TopBar';
import StatusBadge from '../components/StatusBadge';
import { IconPrinter } from '../components/icons';

function formatMoney(n, cur) {
  const php = Number(n || 0);
  const display = cur.convert ? cur.convert(php) : php;
  const s = display.toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur.code === 'PHP' ? 'PHP ' + s : cur.symbol + s;
}

export default function ServerStatus() {
  const toast = useToast();
  const { cur } = useCurrency();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.myOrders().then(setOrders).catch(() => toast.error('Failed to load'));
  }, []);

  useSocketEvent('new_order', (order) => {
    setOrders((cur) => cur.find((o) => o.id === order.id) ? cur : [order, ...cur]);
  });

  useSocketEvent('order_status_update', (order) => {
    setOrders((cur) => {
      const i = cur.findIndex((o) => o.id === order.id);
      if (i < 0) return cur;
      const next = [...cur];
      next[i] = order;
      return next;
    });
    if (order.status === 'ready') {
      toast.success(`Table ${order.table_number} is ready`, 'Pick it up from the kitchen.');
    }
  });

  const active = orders.filter((o) => o.status !== 'served' && o.status !== 'cancelled');
  const past   = orders.filter((o) => o.status === 'served');

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        title="My tables"
        subtitle={`${active.length} active order${active.length === 1 ? '' : 's'}`}
        back="/pos"
        right={<Link to="/pos" className="btn-ghost text-xs">+ New order</Link>}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-3 sm:px-4 py-3 space-y-3">
        {active.length === 0 ? (
          <div className="card p-8 text-center text-sm opacity-50">
            No active orders yet. Place an order from the POS to start.
          </div>
        ) : null}

        {active.map((o) => <MyOrderRow key={o.id} order={o} cur={cur} />)}

        {past.length > 0 ? (
          <details className="card p-3 text-sm">
            <summary className="cursor-pointer font-medium select-none">
              {past.length} completed today
            </summary>
            <div className="mt-2 divide-y" style={{ borderColor: 'var(--line)' }}>
              {past.map((o) => (
                <div key={o.id} className="py-2 flex items-center gap-2">
                  <span className="font-display font-bold">#{o.table_number}</span>
                  <span className="flex-1 text-xs opacity-60">{o.items.length} items</span>
                  <button
                    className="btn-ghost text-xs px-2 py-1 gap-1.5"
                    onClick={() => printCustomerReceipt(o)}
                    title="Print receipt"
                  >
                    <IconPrinter size={12} /> Receipt
                  </button>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </main>
    </div>
  );
}

function MyOrderRow({ order, cur }) {
  const isReady = order.status === 'ready';
  return (
    <div className={'card p-3 ' + (isReady ? 'border-accent' : '')}>
      <div className="flex items-center gap-2">
        <div className="font-display text-2xl font-bold leading-none">#{order.table_number}</div>
        <StatusBadge status={order.status} />
        <div className="ml-auto text-xs opacity-60 flex items-center gap-2">
          <span className="mono">{elapsedLabel(order.created_at)}</span>
          <span className="opacity-30">/</span>
          <span className="mono font-semibold">{formatMoney(order.total, cur)}</span>
        </div>
      </div>
      <ul className="mt-2 space-y-0.5 text-sm">
        {order.items.map((it) => (
          <li key={it.id}>
            <span className="font-semibold mono tabular-nums">{it.qty}x</span> {it.name}
            {it.notes ? <span className="opacity-60 italic"> - {it.notes}</span> : null}
          </li>
        ))}
      </ul>
      {order.notes ? (
        <div className="mt-2 px-3 py-1.5 border border-accent/40 text-xs">
          <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">Note</span>
          <div className="opacity-90">{order.notes}</div>
        </div>
      ) : null}
      {isReady ? (
        <div className="mt-2 px-3 py-1.5 bg-accent text-white text-sm font-semibold text-center">
          Order ready - run it to the table.
        </div>
      ) : null}
    </div>
  );
}
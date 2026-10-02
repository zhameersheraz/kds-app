// ServerStatus - server's phone view of their active orders.
// v6.3: server can cancel their own pending orders, mark ready ones as served.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSocketEvent } from '../lib/useSocketEvent';
import { useAuth } from '../lib/store';
import { useCurrency, fmt } from '../lib/currency';
import { elapsedLabel } from '../lib/format';
import { printCustomerReceipt } from '../lib/printTicket';
import { chime } from '../lib/chime';
import TopBar from '../components/TopBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { IconPrinter } from '../components/icons';

export default function ServerStatus() {
  const toast = useToast();
  const { cur } = useCurrency();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.myOrders().then(setOrders).catch(() => toast.error('Failed to load'));
  }, []);

  useSocketEvent('new_order', (order) => {
    // The backend only emits new_order to the kitchen and admin rooms, so a
    // server never receives these. Kept as a no-op guard rather than dead code.
    if (order.server_id !== user?.id) return;
    setOrders((cur) => (cur.find((o) => o.id === order.id) ? cur : [order, ...cur]));
  });

  useSocketEvent('order_status_update', (order) => {
    // order_status_update is broadcast to EVERY socket, not just a role room.
    // Without this guard, with two servers on the floor every phone chimed for
    // every other server's tables. POS.jsx already had this check.
    if (order.server_id !== user?.id) return;
    setOrders((cur) => {
      const i = cur.findIndex((o) => o.id === order.id);
      if (i < 0) return cur;
      const next = [...cur];
      next[i] = order;
      return next;
    });
    if (order.status === 'ready') {
      toast.success(`Table ${order.table_number} is ready`, 'Pick it up from the kitchen.');
      chime();
    }
  });

  async function setStatus(order, next) {
    try {
      await api.setStatus(order.id, next);
    } catch (e) {
      toast.error('Could not update', e.message);
    }
  }

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

        {active.map((o) => <MyOrderRow key={o.id} order={o} cur={cur} onAction={setStatus} />)}

        {past.length > 0 ? (
          <details className="card p-3 text-sm">
            <summary className="cursor-pointer font-medium select-none">
              {past.length} completed today
            </summary>
            <div className="mt-2 divide-y" style={{ borderColor: 'rgb(var(--c-line))' }}>
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

function MyOrderRow({ order, cur, onAction }) {
  const isReady = order.status === 'ready';
  const isPending = order.status === 'pending';
  const [confirmCancel, setConfirmCancel] = useState(false);

  function cancel() {
    setConfirmCancel(false);
    onAction(order, 'cancelled');
  }

  return (
    <div className={'card p-3 ' + (isReady ? 'border-accent' : '')}>
      <div className="flex items-center gap-2">
        <div className="font-display text-2xl font-bold leading-none">#{order.table_number}</div>
        <StatusBadge status={order.status} />
        <div className="ml-auto text-xs opacity-60 flex items-center gap-2">
          <span className="mono">{elapsedLabel(order.created_at)}</span>
          <span className="opacity-30">/</span>
          <span className="mono font-semibold">{fmt(order.total)}</span>
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
        <div className="mt-2 flex gap-2">
          <div className="flex-1 px-3 py-1.5 bg-accent text-white text-sm font-semibold text-center">
            Order ready - run it to the table.
          </div>
          <button
            className="btn bg-ink text-paper border border-ink hover:bg-ink-soft text-sm"
            onClick={() => onAction(order, 'served')}
            title="Mark Served"
          >
            Served
          </button>
        </div>
      ) : null}
      {isPending ? (
        <div className="mt-2 flex justify-end">
          <button
            className="btn-ghost text-xs text-accent"
            onClick={() => setConfirmCancel(true)}
            title="Cancel this pending order"
          >
            Cancel order
          </button>
        </div>
      ) : null}

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel order?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirmCancel(false)}>Keep it</button>
            <button className="btn-danger" onClick={cancel}>Yes, cancel</button>
          </>
        }
      >
        Order for table <strong>#{order.table_number}</strong> ({order.items.length} item{order.items.length === 1 ? '' : 's'}) will be cancelled. It will not be sent to the kitchen if it has not been already.
      </Modal>
    </div>
  );
}
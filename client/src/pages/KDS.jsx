// KDS - kitchen display. Three columns, paper-receipt style cards.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSocketEvent } from '../lib/useSocketEvent';
import TopBar from '../components/TopBar';
import OrderCard from '../components/OrderCard';
import { IconRefresh } from '../components/icons';

export default function KDS() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.activeOrders().then(setOrders).catch(() => toast.error('Failed to load orders'));
  }, []);

  useSocketEvent('new_order', (order) => {
    setOrders((cur) => cur.find((o) => o.id === order.id) ? cur : [...cur, order]);
    toast.info(`New ticket - table ${order.table_number}`, `${order.items.length} item${order.items.length === 1 ? '' : 's'}`);
    chime(2);
  });

  useSocketEvent('order_status_update', (order) => {
    setOrders((cur) => {
      const i = cur.findIndex((o) => o.id === order.id);
      if (i < 0) return cur;
      const next = [...cur];
      if (order.status === 'served' || order.status === 'cancelled') {
        next.splice(i, 1);
      } else {
        next[i] = order;
      }
      return next;
    });
  });

  const setStatus = useCallback(async (order, next) => {
    try {
      const updated = await api.setStatus(order.id, next);
      setOrders((cur) => cur.map((o) => o.id === order.id ? updated : o));
      if (next === 'ready') chime(1);
    } catch (e) {
      toast.error('Failed to update status', e.message);
    }
  }, [toast]);

  const grouped = useMemo(() => {
    const pending   = orders.filter((o) => o.status === 'pending').sort(byAge);
    const preparing = orders.filter((o) => o.status === 'preparing').sort(byAge);
    const ready     = orders.filter((o) => o.status === 'ready').sort(byAge);
    return { pending, preparing, ready };
  }, [orders]);

  const counts = {
    pending:   grouped.pending.length,
    preparing: grouped.preparing.length,
    ready:     grouped.ready.length
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        title="Kitchen Display"
        subtitle={`${counts.pending + counts.preparing + counts.ready} active - ${counts.ready} ready to run`}
        right={
          <button
            onClick={() => api.activeOrders().then(setOrders).catch(() => {})}
            className="btn-ghost text-xs gap-1.5"
            title="Refresh"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 space-y-5">
        <Column
          title="Pending"
          count={counts.pending}
          accent="opacity-60"
        >
          <Grid items={grouped.pending} onStatus={setStatus} />
        </Column>

        <Column
          title="Preparing"
          count={counts.preparing}
          accent=""
        >
          <Grid items={grouped.preparing} onStatus={setStatus} />
        </Column>

        <Column
          title="Ready to serve"
          count={counts.ready}
          accent="text-accent"
        >
          <Grid items={grouped.ready} onStatus={setStatus} />
        </Column>

        {orders.length === 0 ? (
          <div className="card p-12 text-center opacity-50">
            No active orders. The next ticket will appear here automatically.
          </div>
        ) : null}
      </main>
    </div>
  );
}

function byAge(a, b) {
  return new Date(a.created_at.replace(' ', 'T') + 'Z') -
         new Date(b.created_at.replace(' ', 'T') + 'Z');
}

function Column({ title, count, accent, children }) {
  return (
    <section>
      <header className="flex items-baseline gap-3 mb-3 border-b pb-2" style={{ borderColor: 'var(--line)' }}>
        <h2 className={'font-display text-xl ' + accent}>{title}</h2>
        <span className="text-xs opacity-50 mono tabular-nums">{count}</span>
      </header>
      {children}
    </section>
  );
}

function Grid({ items, onStatus }) {
  if (items.length === 0)
    return <div className="text-sm opacity-40 pl-2">Nothing here right now.</div>;
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((o) => (
        <OrderCard key={o.id} order={o} onStatus={onStatus} />
      ))}
    </div>
  );
}

// Web Audio "ding" - no asset files.
let _ctx = null;
function chime(times = 1) {
  try {
    _ctx = _ctx || new (window.AudioContext || window.webkitAudioContext)();
    const now = _ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const t = now + i * 0.25;
      const o = _ctx.createOscillator();
      const g = _ctx.createGain();
      o.frequency.setValueAtTime(times > 1 ? 880 : 660, t);
      o.frequency.exponentialRampToValueAtTime(times > 1 ? 1320 : 880, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g); g.connect(_ctx.destination);
      o.start(t); o.stop(t + 0.45);
    }
  } catch (_) {}
}
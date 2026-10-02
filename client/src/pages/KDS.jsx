// KDS - kitchen display. Three status rails (pending / preparing / ready) side-by-side on wide screens,
// stacked on tablets/mobile. Each rail is its own column with a header.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/store';
import { useToast } from '../lib/toast';
import { useSocketEvent } from '../lib/useSocketEvent';
import { chime } from '../lib/chime';
import TopBar from '../components/TopBar';
import OrderCard from '../components/OrderCard';
import { IconRefresh } from '../components/icons';

export default function KDS() {
  const { user } = useAuth();
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

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Rail
            title="Pending"
            count={counts.pending}
            tone="muted"
          >
            {grouped.pending.length === 0
              ? <RailEmpty label="Nothing waiting" />
              : grouped.pending.map((o) => (
                  <OrderCard key={o.id} order={o} onStatus={setStatus} viewerRole={user?.role} />
                ))
            }
          </Rail>

          <Rail
            title="Preparing"
            count={counts.preparing}
            tone="default"
          >
            {grouped.preparing.length === 0
              ? <RailEmpty label="Nothing on the stove" />
              : grouped.preparing.map((o) => (
                  <OrderCard key={o.id} order={o} onStatus={setStatus} viewerRole={user?.role} />
                ))
            }
          </Rail>

          <Rail
            title="Ready to serve"
            count={counts.ready}
            tone="accent"
          >
            {grouped.ready.length === 0
              ? <RailEmpty label="Nothing on the pass" />
              : grouped.ready.map((o) => (
                  <OrderCard key={o.id} order={o} onStatus={setStatus} viewerRole={user?.role} />
                ))
            }
          </Rail>
        </div>
      </main>
    </div>
  );
}

function byAge(a, b) {
  return new Date(a.created_at.replace(' ', 'T') + 'Z') -
         new Date(b.created_at.replace(' ', 'T') + 'Z');
}

function Rail({ title, count, tone, children }) {
  const headTone =
    tone === 'accent' ? 'text-accent' :
    tone === 'muted'  ? 'opacity-60'   :
                        '';
  return (
    <section className="flex flex-col min-w-0 bg-paper/40 border border-line rounded-md">
      <header className="flex items-baseline justify-between gap-3 px-3 py-2 border-b border-line sticky top-0 bg-paper/95 backdrop-blur">
        <h2 className={'font-display text-lg ' + headTone}>{title}</h2>
        <span className="text-xs opacity-60 mono tabular-nums">{count} {count === 1 ? 'ticket' : 'tickets'}</span>
      </header>
      <div className="flex-1 p-2 sm:p-3 space-y-3 min-h-[120px]">
        {children}
      </div>
    </section>
  );
}

function RailEmpty({ label }) {
  return (
    <div className="border border-dashed border-line rounded p-4 text-center text-xs opacity-40">
      {label}
    </div>
  );
}

// KDS order card - paper-receipt aesthetic. Color coded by wait time only.
// High contrast, no shadows, large table number for at-a-glance reading.

import React, { useEffect, useState } from 'react';
import { waitBucket, elapsedLabel } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { printKitchenTicket } from '../lib/printTicket';
import StatusBadge from './StatusBadge';
import { IconPrinter, IconArrowRight } from './icons';

function formatMoney(n, cur) {
  const php = Number(n || 0);
  const display = cur.convert ? cur.convert(php) : php;
  const s = display.toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur.code === 'PHP' ? 'PHP ' + s : cur.symbol + s;
}

export default function OrderCard({ order, onStatus }) {
  const { cur } = useCurrency();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const bucket = order.status === 'ready' ? 'fresh' : waitBucket(order.created_at);

  const next = {
    pending:   'preparing',
    preparing: 'ready',
    ready:     'served'
  }[order.status];

  const nextLabel = {
    preparing: 'Start Preparing',
    ready:     'Mark Ready',
    served:    'Mark Served'
  }[next];

  const dotColor =
    bucket === 'late' ? 'bg-accent' :
    bucket === 'warm' ? 'bg-ink dark:bg-paper' :
                        'bg-emerald-600';

  return (
    <article
      className={'card relative overflow-hidden ' + (order.status === 'ready' ? 'animate-pulse-ring' : '')}
    >
      <div
        className={
          'absolute left-0 top-0 bottom-0 w-1 ' +
          (bucket === 'late' ? 'bg-accent' : bucket === 'warm' ? 'bg-ink dark:bg-paper' : 'bg-emerald-600')
        }
        aria-hidden
      />

      <header className="px-4 pt-3 pb-2 flex items-baseline justify-between border-b" style={{ borderColor: 'var(--line)' }}>
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-50">Table</div>
          <div className="font-display text-3xl font-bold leading-none">#{order.table_number}</div>
        </div>
        <div className="text-right">
          <StatusBadge status={order.status} />
          <div className="mt-1 flex items-center gap-1.5 text-xs opacity-70 justify-end">
            <span className={'inline-block h-1.5 w-1.5 rounded-full ' + dotColor} />
            <span className="mono">{elapsedLabel(order.created_at, order.status === 'served' ? order.updated_at : null)}</span>
          </div>
        </div>
      </header>

      <ol className="px-4 py-3 space-y-1.5 mono text-sm">
        {order.items.map((it) => (
          <li key={it.id}>
            <span className="inline-block w-7 font-bold text-right tabular-nums">{it.qty}x</span>
            <span className="ml-2">{it.name}</span>
            {it.notes ? <div className="ml-9 text-xs italic opacity-70">- {it.notes}</div> : null}
          </li>
        ))}
      </ol>

      {order.notes ? (
        <div className="mx-4 mb-3 px-3 py-1.5 border border-accent/40 text-xs">
          <div className="font-semibold uppercase tracking-wider text-accent text-[10px]">Note</div>
          <div className="opacity-90">{order.notes}</div>
        </div>
      ) : null}

      <footer className="px-4 py-2.5 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-3">
          <div className="text-sm mono font-semibold">{formatMoney(order.total, cur)}</div>
          <div className="text-xs opacity-60 hidden sm:block">{order.server_name}</div>
          <button
            className="btn-quiet px-1.5 py-1 text-xs opacity-70 hover:opacity-100"
            onClick={() => printKitchenTicket(order)}
            title="Print ticket"
          >
            <IconPrinter size={14} />
          </button>
        </div>

        {next ? (
          <button
            className={
              next === 'preparing' ? 'btn border border-ink dark:border-paper' :
              next === 'ready'     ? 'btn bg-accent text-white border border-accent hover:bg-accent-soft' :
                                     'btn bg-ink text-paper border border-ink hover:bg-ink-soft dark:bg-paper dark:text-ink dark:border-paper'
            }
            onClick={() => onStatus(order, next)}
          >
            {nextLabel}
            <IconArrowRight size={14} />
          </button>
        ) : (
          <span className="text-xs italic opacity-50">
            {order.status === 'served' ? 'Completed' : order.status === 'cancelled' ? 'Cancelled' : '-'}
          </span>
        )}
      </footer>
    </article>
  );
}
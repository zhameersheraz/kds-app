// Admin dashboard - all orders, today's sales, top items.

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSocketEvent } from '../lib/useSocketEvent';
import TopBar from '../components/TopBar';
import StatusBadge from '../components/StatusBadge';
import { useCurrency, fmt } from '../lib/currency';
import { elapsedLabel } from '../lib/format';
import { IconRefresh, IconList, IconChart } from '../components/icons';


export default function Admin() {
  const toast = useToast();
  const { cur } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [sales,  setSales]  = useState(null);
  const [status, setStatus] = useState('all');
  const [tab,    setTab]    = useState('overview');

  function loadAll() {
    api.allOrders(status === 'all' ? '' : status, 200).then(setOrders).catch(() => toast.error('Failed to load orders'));
    api.sales().then(setSales).catch(() => toast.error('Failed to load sales'));
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [status]);
  useSocketEvent('new_order',          () => loadAll());
  useSocketEvent('order_status_update',() => loadAll());

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        title="Admin"
        subtitle={sales ? `${sales.totals.orders} orders today - ${fmt(sales.totals.revenue)} revenue` : 'Loading...'}
        right={
          <button onClick={loadAll} className="btn-ghost text-xs gap-1.5" title="Refresh">
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 space-y-5">
        <nav className="flex items-center gap-6 border-b" style={{ borderColor: 'rgb(var(--c-line))' }}>
          <Tab active={tab === 'overview'} onClick={() => setTab('overview')} icon={<IconChart size={14} />}>Overview</Tab>
          <Tab active={tab === 'orders'}   onClick={() => setTab('orders')}   icon={<IconList size={14}  />}>Orders</Tab>
        </nav>

        {tab === 'overview' && sales ? (
          <Overview sales={sales} cur={cur} />
        ) : null}

        {tab === 'orders' ? (
          <OrdersTable orders={orders} status={status} setStatus={setStatus} cur={cur} />
        ) : null}
      </main>
    </div>
  );
}

function Tab({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={
        'flex items-center gap-1.5 py-2 -mb-px text-sm font-medium uppercase tracking-wider border-b-2 transition ' +
        (active ? 'border-accent text-current' : 'border-transparent opacity-50 hover:opacity-100')
      }
    >
      {icon} {children}
    </button>
  );
}

function Overview({ sales, cur }) {
  const { totals, byStatus, week, topItems } = sales;
  const cards = [
    { label: "Today's orders",  value: totals.orders,                       size: 'sm' },
    { label: "Today's revenue", value: fmt(totals.revenue),    size: 'lg' },
    { label: 'Pending now',     value: byStatus.find((b) => b.status === 'pending')?.count   || 0, size: 'sm' },
    { label: 'Preparing now',   value: byStatus.find((b) => b.status === 'preparing')?.count || 0, size: 'sm' }
  ];
  return (
    <>
      <section>
        <h2 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Today at a glance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="card p-3 sm:p-4 min-w-0">
              <div className="text-[10px] uppercase tracking-widest opacity-60 truncate">{c.label}</div>
              <div className={
                'font-display font-bold mt-1 mono tabular-nums truncate ' +
                (c.size === 'lg' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl')
              }>{c.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Last 7 days</h2>
        <div className="card p-4">
          <Spark week={week} cur={cur} />
        </div>
      </section>

      {topItems && topItems.length > 0 ? (
        <section>
          <h2 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Top items today</h2>
          <div className="card p-4">
            <ol className="space-y-1.5 text-sm">
              {topItems.map((it, i) => (
                <li key={it.name} className="flex items-center gap-3">
                  <span className="w-5 opacity-40 mono">{i + 1}.</span>
                  <span className="flex-1">{it.name}</span>
                  <span className="opacity-60 mono">{it.qty} sold</span>
                  <span className="font-semibold mono tabular-nums">{fmt(it.revenue)}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </>
  );
}

function Spark({ week, cur }) {
  if (!week || week.length === 0) return <div className="text-sm opacity-50">No data yet</div>;
  const max = Math.max(...week.map((d) => d.revenue), 1);
  const W = 600, H = 80, PAD = 8;
  const stepX = (W - PAD * 2) / Math.max(1, week.length - 1);
  const points = week.map((d, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - (d.revenue / max) * (H - PAD * 2);
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full h-24" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
        {points.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill="currentColor" />
            <text x={x} y={H + 18} fontSize="10" textAnchor="middle" fill="currentColor" opacity="0.6">{week[i].day.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function OrdersTable({ orders, status, setStatus, cur }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[10px] uppercase tracking-widest opacity-60">Filter by status</h2>
        <select
          className="input py-1 text-sm w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-xs opacity-50 mono">{orders.length} rows</span>
      </div>

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-sm opacity-50">No orders match the current filter.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest opacity-60 border-b" style={{ borderColor: 'rgb(var(--c-line))' }}>
              <tr>
                <th className="text-left  px-3 py-2">Table</th>
                <th className="text-left  px-3 py-2">Server</th>
                <th className="text-left  px-3 py-2">Items</th>
                <th className="text-right px-3 py-2">Total</th>
                <th className="text-left  px-3 py-2">Status</th>
                <th className="text-left  px-3 py-2">Age</th>
                <th className="text-left  px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'rgb(var(--c-line))' }}>
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-ink/[0.02] dark:hover:bg-paper/[0.02]">
                  <td className="px-3 py-2 font-display font-bold">#{o.table_number}</td>
                  <td className="px-3 py-2">{o.server_name}</td>
                  <td className="px-3 py-2 max-w-[260px] truncate opacity-70">
                    {o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold mono tabular-nums">{fmt(o.total)}</td>
                  <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-2 mono text-xs opacity-60">{elapsedLabel(o.created_at, o.status === 'served' ? o.updated_at : null)}</td>
                  <td className="px-3 py-2 text-xs opacity-60 mono">{(o.created_at || '').replace('T', ' ').slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
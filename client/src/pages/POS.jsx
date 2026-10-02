// POS - server-facing order entry. Mobile-first, monochrome, product images.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSocketEvent } from '../lib/useSocketEvent';
import TopBar from '../components/TopBar';
import MenuGrid from '../components/MenuGrid';
import OrderTicket from '../components/OrderTicket';
import { useAuth } from '../lib/store';
import { chime } from '../lib/chime';
import { IconList } from '../components/icons';

let _draftId = 1;

export default function POS() {
  const { user } = useAuth();
  const toast = useToast();

  const [menu, setMenu] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listMenu().then(setMenu).catch(() => toast.error('Failed to load menu'));
  }, []);

  useSocketEvent('order_status_update', (order) => {
    if (order.server_id !== user?.id) return;
    if (order.status === 'ready') {
      toast.success(`Table ${order.table_number} is ready`, 'Run the food to the customer.');
      chime();
    } else if (order.status === 'served') {
      toast.info(`Table ${order.table_number} marked served`);
    }
  });

  function addItem(item) {
    setLines((cur) => {
      const i = cur.findIndex((l) => l.menuItemId === item.id && !l.notes);
      if (i >= 0) {
        const next = [...cur];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...cur, {
        id: `tmp_${_draftId++}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        notes: ''
      }];
    });
  }

  async function submit() {
    if (!tableNumber || lines.length === 0) return;
    setBusy(true);
    try {
      const payload = {
        tableNumber: tableNumber.trim(),
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          qty: l.qty,
          notes: l.notes || undefined
        }))
      };
      const created = await api.createOrder(payload);
      toast.success(`Table ${created.table_number} sent`, 'Kitchen has it.');
      chime();
      setLines([]);
      setNotes('');
      setTableNumber('');
    } catch (e) {
      toast.error('Failed to send order', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        title="New order"
        subtitle={user?.name ? `Server: ${user.name}` : undefined}
        right={
          <div className="flex items-center gap-2">
            <Link to="/server-status" className="btn-ghost text-xs gap-1.5">
              <IconList size={14} /> My orders
            </Link>
          </div>
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-3 grid gap-3 lg:grid-cols-[1fr_380px]">
        <div className="card p-3 sm:p-4 min-h-[60vh] lg:min-h-[80vh]">
          <MenuGrid items={menu} onAdd={addItem} />
        </div>
        <div className="lg:sticky lg:top-[64px] lg:h-[calc(100vh-86px)] min-h-[40vh]">
          <OrderTicket
            tableNumber={tableNumber}
            setTableNumber={setTableNumber}
            lines={lines}
            setLines={setLines}
            notes={notes}
            setNotes={setNotes}
            onSubmit={submit}
            busy={busy}
          />
        </div>
      </main>
    </div>
  );
}
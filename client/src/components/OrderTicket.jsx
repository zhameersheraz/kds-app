// Order ticket (right side of POS). Running list, paper-form style.

import React, { useState } from 'react';
import { fmt } from '../lib/currency';
import { IconPlus, IconMinus, IconClose } from './icons';

export default function OrderTicket({ tableNumber, setTableNumber, lines, setLines, notes, setNotes, onSubmit, busy }) {
  const [confirming, setConfirming] = useState(false);

  // The server records total = SUM(price * qty). This screen used to add an
  // 8% tax on top, so the server quoted the customer one number and the order
  // was stored, printed and reported as a different one. Show the same maths
  // the backend will store.
  const subtotal = lines.reduce((acc, l) => acc + l.qty * l.price, 0);
  const total = subtotal;
  const empty = lines.length === 0;
  const valid = !!tableNumber && !empty;

  function setQty(idx, qty) {
    const next = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
    setLines((cur) => cur.map((l, i) => i === idx ? { ...l, qty: next } : l));
  }
  function setNote(idx, value) {
    setLines((cur) => cur.map((l, i) => i === idx ? { ...l, notes: value } : l));
  }
  function remove(idx) {
    setLines((cur) => cur.filter((_, i) => i !== idx));
  }
  function clearAll() {
    setLines([]);
    setNotes('');
    setConfirming(false);
  }

  return (
    <aside className="card flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b space-y-3" style={{ borderColor: 'rgb(var(--c-line))' }}>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Table or customer</span>
          <input
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            inputMode="numeric"
            placeholder="7"
            className="input mono text-lg"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Order note</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional - allergies, special requests"
            className="input"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {empty ? (
          <div className="text-center text-sm opacity-50 py-12">
            No items yet. Tap the menu to start an order.
          </div>
        ) : (
          lines.map((l, i) => (
            <div key={l.id} className="border-b pb-3" style={{ borderColor: 'rgb(var(--c-line))' }}>
              <div className="flex items-center gap-2">
                <div className="flex items-center border" style={{ borderColor: 'rgb(var(--c-line))' }}>
                  <button
                    className="px-2 py-1 hover:bg-ink/5 dark:hover:bg-paper/5"
                    onClick={() => setQty(i, l.qty - 1)}
                    aria-label="Decrease"
                  ><IconMinus size={14} /></button>
                  <span className="px-2 min-w-[2rem] text-center mono text-sm font-semibold tabular-nums">{l.qty}</span>
                  <button
                    className="px-2 py-1 hover:bg-ink/5 dark:hover:bg-paper/5"
                    onClick={() => setQty(i, l.qty + 1)}
                    aria-label="Increase"
                  ><IconPlus size={14} /></button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug truncate">{l.name}</div>
                  <div className="text-[11px] opacity-60 mono">{fmt(l.price)} each</div>
                </div>
                <div className="text-sm mono font-semibold tabular-nums">
                  {fmt(l.price * l.qty)}
                </div>
                <button
                  className="opacity-40 hover:opacity-100 hover:text-accent"
                  onClick={() => remove(i)}
                  aria-label="Remove"
                ><IconClose size={14} /></button>
              </div>
              <input
                value={l.notes || ''}
                onChange={(e) => setNote(i, e.target.value)}
                placeholder="Special instructions"
                className="input mt-2 text-xs py-1"
              />
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: 'rgb(var(--c-line))', background: 'rgb(var(--c-paper))' }}>
        <div className="flex justify-between text-sm">
          <span className="opacity-60">Subtotal</span>
          <span className="mono">{fmt(subtotal)}</span>
        </div>
        <div className="rule my-1" />
        <div className="flex justify-between text-lg font-display font-bold">
          <span>Total</span>
          <span className="mono">{fmt(total)}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="btn-ghost flex-1"
            onClick={clearAll}
            disabled={empty || busy}
          >Clear</button>
          {!confirming ? (
            <button
              className="btn-primary flex-1"
              disabled={!valid || busy}
              onClick={() => setConfirming(true)}
            >
              {busy ? 'Sending...' : `Send to kitchen (${lines.length || 0})`}
            </button>
          ) : (
            <button
              className="btn-accent flex-1"
              onClick={() => { setConfirming(false); onSubmit(); }}
              disabled={busy}
            >
              {busy ? 'Sending...' : 'Confirm send'}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
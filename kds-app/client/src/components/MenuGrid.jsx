// Menu grid for the POS. Categories on top, item cards under with line-art image.

import React, { useMemo, useState } from 'react';
import { useCurrency } from '../lib/currency';
import ProductImage from './ProductImage';

function formatMoney(n, cur) {
  const php = Number(n || 0);
  const display = cur.convert ? cur.convert(php) : php;
  const s = display.toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur.code === 'PHP' ? 'PHP ' + s : cur.symbol + s;
}

export default function MenuGrid({ items, onAdd }) {
  const { cur } = useCurrency();
  const categories = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const it of items) {
      if (!seen.has(it.category)) { seen.add(it.category); out.push(it.category); }
    }
    return out;
  }, [items]);

  const [active, setActive] = useState(categories[0] || '');
  const visible = useMemo(
    () => items.filter((i) => i.category === active && i.available),
    [items, active]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-4 border-b mb-4 overflow-x-auto -mx-1 px-1" style={{ borderColor: 'var(--line)' }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={
              'pb-2 -mb-px text-sm font-medium uppercase tracking-wider transition ' +
              (c === active
                ? 'border-b-2 border-accent text-current'
                : 'border-b-2 border-transparent opacity-50 hover:opacity-100')
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 -mr-1">
        {visible.map((it) => (
          <button
            key={it.id}
            onClick={() => onAdd(it)}
            className="card text-left p-3 hover:border-ink dark:hover:border-paper transition group"
          >
            <div className="aspect-square mb-3 flex items-center justify-center opacity-90 group-hover:opacity-100">
              <ProductImage image={it.image} name={it.name} className="w-full h-full" />
            </div>
            <div className="text-sm font-medium leading-snug">{it.name}</div>
            {it.description ? (
              <div className="text-[11px] opacity-60 line-clamp-2 mt-0.5">{it.description}</div>
            ) : null}
            <div className="mt-2 text-sm font-semibold mono">{formatMoney(it.price, cur)}</div>
          </button>
        ))}
        {visible.length === 0 ? (
          <div className="col-span-full text-center text-sm opacity-50 py-12">
            No items in this category.
          </div>
        ) : null}
      </div>
    </div>
  );
}
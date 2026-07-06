// Currency provider. Persists choice to localStorage.
// Default: PHP. USD mode converts prices using a fixed exchange rate
// (the database stores all prices in PHP - the source of truth).

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Approximate market rate (Sep 2026-ish). For a school demo - not a live feed.
// Adjust here if you want a different baseline.
export const RATE_PHP_PER_USD = 56;

export const CURRENCIES = {
  PHP: { code: 'PHP', symbol: 'PHP', label: 'Philippine Peso', locale: 'en-PH', convert: (php) => php },
  USD: { code: 'USD', symbol: '$',   label: 'US Dollar',      locale: 'en-US', convert: (php) => php / RATE_PHP_PER_USD }
};

const CurrencyCtx = createContext(null);

function readStored() {
  try {
    const v = localStorage.getItem('kds_currency');
    if (v === 'PHP' || v === 'USD') return v;
  } catch (_) {}
  return 'PHP';
}

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(readStored);

  useEffect(() => {
    try { localStorage.setItem('kds_currency', code); } catch (_) {}
  }, [code]);

  const value = useMemo(() => {
    const cur = CURRENCIES[code] || CURRENCIES.PHP;
    return {
      code,
      cur,
      all: CURRENCIES,
      rate: RATE_PHP_PER_USD,
      setCode,
      toggle: () => setCode((c) => (c === 'PHP' ? 'USD' : 'PHP'))
    };
  }, [code]);

  return <CurrencyCtx.Provider value={value}>{children}</CurrencyCtx.Provider>;
}

export function useCurrency() { return useContext(CurrencyCtx); }

// Format a PHP amount using the active currency.
// All money in the database is PHP. USD is a converted display only.
export function fmt(amount) {
  const ctx = useContext(CurrencyCtx);
  const cur = (ctx && ctx.cur) || CURRENCIES.PHP;
  const php = Number(amount || 0);
  const display = cur.convert(php);
  const s = display.toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur.code === 'PHP' ? 'PHP ' + s : cur.symbol + s;
}
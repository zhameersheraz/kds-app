// Theme provider - light / dark / system. Persists choice to localStorage.
// Toggles the `dark` class on <html> so Tailwind dark variants activate.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeCtx = createContext(null);

function readStored() {
  try {
    const v = localStorage.getItem('kds_theme');
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch (_) {}
  return 'light';
}

function applyTheme(mode) {
  const root = document.documentElement;
  let actual = mode;
  if (mode === 'system') {
    actual = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.classList.toggle('dark', actual === 'dark');
  root.dataset.theme = actual;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readStored);

  useEffect(() => {
    applyTheme(mode);
    try { localStorage.setItem('kds_theme', mode); } catch (_) {}

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => applyTheme('system');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, [mode]);

  const cycle = () => setMode((cur) => cur === 'light' ? 'dark' : cur === 'dark' ? 'system' : 'light');

  const value = useMemo(() => ({ mode, setMode, cycle }), [mode]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() { return useContext(ThemeCtx); }
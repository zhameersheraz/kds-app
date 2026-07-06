// Login page - serif wordmark, single column, monochrome, no emoji.

import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/store';
import { useTheme } from '../lib/theme';
import { IconSun, IconMoon, IconSystem } from '../components/icons';

const DEMO = [
  { role: 'Server',  username: 'server',  password: 'server123' },
  { role: 'Kitchen', username: 'kitchen', password: 'kitchen123' },
  { role: 'Admin',   username: 'zham',    password: 'zham123'   }
];

export default function Login() {
  const { user, login } = useAuth();
  const { mode, cycle } = useTheme();
  const nav = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (user) {
    if (user.role === 'kitchen') return <Navigate to="/kds" replace />;
    if (user.role === 'admin')   return <Navigate to="/admin" replace />;
    return <Navigate to="/pos" replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      nav('/');
    } catch (_) {
      setErr('Invalid credentials');
    } finally {
      setBusy(false);
    }
  }

  function quick(p) {
    setUsername(p.username);
    setPassword(p.password);
  }

  const ThemeIcon = mode === 'light' ? IconSun : mode === 'dark' ? IconMoon : IconSystem;

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 paper-grain">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="font-display text-2xl font-bold tracking-tight">
            <span className="inline-block border-l-2 border-accent pl-2">KDS</span>
            <span className="ml-2 opacity-50 text-base">/ Kitchen Display</span>
          </div>
          <button onClick={cycle} className="btn-quiet p-1.5" title={'Theme: ' + mode}>
            <ThemeIcon size={18} />
          </button>
        </div>

        <h1 className="font-display text-4xl mb-2">Sign in</h1>
        <p className="text-sm opacity-60 mb-8">Use your account to start taking or preparing orders.</p>

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Username</span>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="server"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Password</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>

          {err ? <div className="text-sm text-accent">{err}</div> : null}

          <button
            className="btn-primary w-full"
            disabled={busy || !username || !password}
            type="submit"
          >
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm opacity-70 mt-6 text-center">
          New here? <Link to="/signup" className="underline underline-offset-2">Create an account</Link>
        </p>

        <div className="my-8 border-t" style={{ borderColor: 'var(--line)' }} />
        <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Demo accounts</div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO.map((p) => (
            <button
              key={p.username}
              type="button"
              onClick={() => quick(p)}
              className="border px-2 py-2 text-left hover:border-ink dark:hover:border-paper transition"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider">{p.role}</div>
              <div className="text-[11px] opacity-60 mono">{p.username}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
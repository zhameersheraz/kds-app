// Login page - clean monochrome. Signup is intentionally hidden; admins can
// create accounts at /signup directly.
// v6: removed theme toggle, added show/hide password button.

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/store';
import { IconEye, IconEyeOff } from '../components/icons';

const DEMO = [
  { role: 'Server',  username: 'server',  password: 'ServerPass!2026-KDS' },
  { role: 'Kitchen', username: 'kitchen', password: 'KitchenPass!2026-KDS' },
  { role: 'Admin',   username: 'zham',    password: 'ZhamAdmin!2026-KDS'  }
];

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 paper-grain">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="font-display text-2xl font-bold tracking-tight">
            <span className="inline-block border-l-2 border-accent pl-2">KDS</span>
            <span className="ml-2 opacity-50 text-base">/ Kitchen Display</span>
          </div>
        </div>

        <h1 className="font-display text-4xl mb-2">Sign in</h1>
        <p className="text-sm text-muted mb-8">Use your account to start taking or preparing orders.</p>

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest text-muted mb-1">Username</span>
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
            <span className="block text-[10px] uppercase tracking-widest text-muted mb-1">Password</span>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                autoCapitalize="off"
                autoCorrect="off"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
                title={showPw ? 'Hide password' : 'Show password'}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
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

        <div className="my-8 border-t border-line" />
        <div className="text-[10px] uppercase tracking-widest text-muted mb-2">Demo accounts (click to fill)</div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO.map((p) => (
            <button
              key={p.username}
              type="button"
              onClick={() => quick(p)}
              className="border border-line px-2 py-2 text-left hover:border-ink transition"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider">{p.role}</div>
              <div className="text-[11px] text-muted mono">{p.username}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
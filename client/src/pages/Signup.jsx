// Signup - open registration. First user auto-becomes admin (server-side).

import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/store';

const ROLES = [
  { value: 'server',  label: 'Server',  desc: 'Takes orders at the counter' },
  { value: 'kitchen', label: 'Kitchen', desc: 'Prepares orders, marks ready' },
  { value: 'admin',   label: 'Admin',   desc: 'Full access to all screens'  }
];

export default function Signup() {
  const { user, signup } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('server');
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
    if (password.length < 6) { setErr('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      await signup(name, username.trim(), password, role);
      nav('/');
    } catch (e) {
      const code = e?.data?.error;
      setErr(
        code === 'username_taken' ? 'That username is already in use' :
        code === 'weak_password'   ? 'Password must be at least 6 characters' :
        'Could not create account'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 paper-grain">
      <div className="w-full max-w-md">
        <div className="font-display text-2xl font-bold tracking-tight mb-8">
          <span className="inline-block border-l-2 border-accent pl-2">KDS</span>
          <span className="ml-2 opacity-50 text-base">/ Create account</span>
        </div>

        <h1 className="font-display text-4xl mb-2">New account</h1>
        <p className="text-sm opacity-60 mb-8">First account created becomes the admin.</p>

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Display name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan dela Cruz"
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Username</span>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="juan"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">Password</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="new-password"
            />
          </label>

          <div>
            <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Role</span>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={
                    'border p-3 text-left transition ' +
                    (role === r.value
                      ? 'border-ink dark:border-paper bg-ink/5 dark:bg-paper/5'
                      : 'opacity-60 hover:opacity-100')
                  }
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div className="text-sm font-semibold uppercase tracking-wider">{r.label}</div>
                  <div className="text-[11px] opacity-70 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {err ? <div className="text-sm text-accent">{err}</div> : null}

          <button
            className="btn-primary w-full"
            disabled={busy || !name || !username || !password}
            type="submit"
          >
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm opacity-70 mt-6 text-center">
          Already have an account? <Link to="/login" className="underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
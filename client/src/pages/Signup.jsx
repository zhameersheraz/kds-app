// Signup page - two-column layout: illustration on the left, form on the right.
// Open registration for staff accounts. The first account on a fresh database
// becomes admin automatically; every later signup is server or kitchen.
// v6.1: brand link points to landing; show/hide password toggle.

import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/store';
import { IconEye, IconEyeOff } from '../components/icons';

// Admin was offered here as a one-click option, and the backend honoured it.
// On a publicly reachable app that made every admin screen one POST away.
const ROLES = [
  { value: 'server',  label: 'Server',  desc: 'Takes orders at the counter' },
  { value: 'kitchen', label: 'Kitchen', desc: 'Prepares orders, marks ready' }
];

export default function Signup() {
  const { user, signup } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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
    if (password.length < 8) { setErr('Password must be at least 8 characters'); return; }
    setBusy(true);
    try {
      await signup(name, username.trim(), password, role);
      nav('/');
    } catch (e) {
      const code = e?.data?.error;
      setErr(
        code === 'username_taken' ? 'That username is already in use' :
        code === 'weak_password'   ? 'Password must be at least 8 characters' :
        'Could not create account'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr]">
      {/* Left: visual hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink text-paper relative overflow-hidden">
        <div className="relative z-10">
          <Link to="/landing" className="inline-block">
            <div className="font-display text-2xl font-bold tracking-tight">
              <span className="inline-block border-l-2 border-accent pl-2">KDS</span>
              <span className="ml-2 opacity-50 text-base">/ Kitchen Display</span>
            </div>
          </Link>
        </div>

        <KitchenIllustration />

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-3xl leading-tight mb-3">
            Run your kitchen with clarity.
          </h2>
          <p className="text-sm opacity-70 leading-relaxed">
            Orders flow from the counter to the kitchen to the table - real-time,
            on every device, no chaos.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-4 py-10 paper-grain">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6">
            <Link to="/landing" className="font-display text-2xl font-bold tracking-tight">
              <span className="inline-block border-l-2 border-accent pl-2">KDS</span>
            </Link>
          </div>

          <h1 className="font-display text-4xl mb-2">New account</h1>
          <p className="text-sm text-muted mb-8">Creates a server or kitchen account. An admin can promote you later.</p>

          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-muted mb-1">Display name</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan dela Cruz"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-muted mb-1">Username</span>
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
              <span className="block text-[10px] uppercase tracking-widest text-muted mb-1">Password</span>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="new-password"
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

            <div>
              <span className="block text-[10px] uppercase tracking-widest text-muted mb-2">Role</span>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={
                      'border p-3 text-left transition ' +
                      (role === r.value
                        ? 'border-ink bg-ink/5'
                        : 'border-line opacity-60 hover:opacity-100')
                    }
                  >
                    <div className="text-sm font-semibold uppercase tracking-wider">{r.label}</div>
                    <div className="text-[11px] text-muted mt-0.5">{r.desc}</div>
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

          <p className="text-sm text-muted mt-6 text-center">
            Already have an account? <Link to="/login" className="text-accent underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Hand-drawn kitchen scene: ticket + plate + utensils, line-art style.
function KitchenIllustration() {
  return (
    <svg
      viewBox="0 0 500 500"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.18 }}
      aria-hidden
    >
      {/* Receipt ticket */}
      <g transform="translate(80,90)" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0 0h180v320l-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10V0z" />
        <line x1="20" y1="50"  x2="160" y2="50"  strokeDasharray="4 3" />
        <line x1="30" y1="80"  x2="150" y2="80"  />
        <line x1="30" y1="100" x2="150" y2="100" />
        <line x1="30" y1="120" x2="120" y2="120" />
        <line x1="20" y1="160" x2="160" y2="160" strokeDasharray="4 3" />
        <line x1="30" y1="190" x2="150" y2="190" />
        <line x1="30" y1="210" x2="130" y2="210" />
        <line x1="30" y1="240" x2="150" y2="240" />
        <line x1="30" y1="260" x2="140" y2="260" />
        <line x1="20" y1="290" x2="160" y2="290" strokeDasharray="4 3" />
      </g>
      {/* Plate with burger */}
      <g transform="translate(290,180)" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="80" cy="80" r="78" />
        <circle cx="80" cy="80" r="62" />
        {/* bun top */}
        <path d="M44 70c0-22 16-38 36-38s36 16 36 38" />
        {/* lettuce */}
        <path d="M40 78c4 6 12 6 16 2 4 6 12 6 16 0 4 6 12 6 16 0 4 6 12 6 16 0" />
        {/* cheese */}
        <path d="M40 86h80l-4 8H44z" />
        {/* patty */}
        <rect x="42" y="96" width="76" height="10" rx="2" />
        {/* bun bottom */}
        <path d="M44 108c0 8 16 16 36 16s36-8 36-16" />
      </g>
      {/* Whisk */}
      <g transform="translate(60,360)" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0 0l40 80" />
        <ellipse cx="48" cy="92" rx="22" ry="14" transform="rotate(-30 48 92)" />
        <ellipse cx="58" cy="76" rx="18" ry="12" transform="rotate(-50 58 76)" />
      </g>
    </svg>
  );
}
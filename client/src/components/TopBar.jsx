// TopBar - app shell header. Shows live clock + currency switcher.
// Logout uses a confirmation modal.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/store';
import { useCurrency } from '../lib/currency';
import { IconClock, IconLogout } from './icons';
import Modal from './Modal';

export default function TopBar({ title, subtitle, back, right }) {
  const { user, logout } = useAuth();
  const { code, toggle } = useCurrency();
  const nav = useNavigate();

  const [now, setNow] = useState(() => formatNow());
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(formatNow()), 1000);
    return () => clearInterval(id);
  }, []);

  function performLogout() {
    logout();
    setConfirmLogout(false);
    nav('/login');
  }

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b bg-paper border-line"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 flex-wrap">
          {back ? (
            <Link to={back} className="btn-quiet px-2 py-1.5" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
              </svg>
            </Link>
          ) : (
            <Link to="/" className="font-display text-lg font-bold tracking-tight leading-none whitespace-nowrap">
              <span className="inline-block border-l-2 border-accent pl-2">KDS</span>
            </Link>
          )}

          <div className="flex-1 min-w-0 order-3 sm:order-2 basis-full sm:basis-auto mt-2 sm:mt-0">
            <h1 className="font-display text-base sm:text-lg leading-tight truncate">{title}</h1>
            {subtitle ? <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted truncate">{subtitle}</div> : null}
          </div>

          {right ? <div className="hidden sm:flex items-center gap-2 order-2 sm:order-3">{right}</div> : null}

          <div className="flex items-center gap-1 order-2 sm:order-3 ml-auto sm:ml-0">
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 text-xs mono text-muted">
              <IconClock size={14} />
              <span>{now}</span>
            </div>

            <button onClick={toggle} className="btn-quiet px-2 py-1.5 text-xs mono" title="Switch currency">
              {code}
            </button>

            {user ? (
              <>
                <span className="chip-ghost hidden lg:inline-flex">{user.role}</span>
                <button
                  className="btn-quiet px-2 py-1.5"
                  onClick={() => setConfirmLogout(true)}
                  title="Sign out"
                >
                  <IconLogout size={16} />
                </button>
              </>
            ) : null}
          </div>
        </div>

        {right ? <div className="sm:hidden px-3 pb-2 flex items-center gap-2">{right}</div> : null}
      </header>

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Sign out?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirmLogout(false)}>Cancel</button>
            <button className="btn-danger" onClick={performLogout}>Sign out</button>
          </>
        }
      >
        You'll be returned to the sign-in screen. Any in-progress draft order on this device will be lost.
      </Modal>
    </>
  );
}

function formatNow() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
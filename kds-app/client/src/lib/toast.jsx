// Small notifications store. Components subscribe to push messages in the
// bottom-right of the screen. Used for "Order Ready" alerts on the server's
// phone and "New Order" toasts on the kitchen display.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastCtx = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = nextId++;
    const t = { id, kind: 'info', ttl: 4000, ...toast };
    setToasts((cur) => [...cur, t]);
    if (t.ttl > 0) setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), t.ttl);
    return id;
  }, []);

  const dismiss = useCallback((id) => setToasts((cur) => cur.filter((x) => x.id !== id)), []);

  const api = useMemo(() => ({
    push,
    success: (title, message) => push({ kind: 'success', title, message }),
    info:    (title, message) => push({ kind: 'info',    title, message }),
    warn:    (title, message) => push({ kind: 'warning', title, message, ttl: 6000 }),
    error:   (title, message) => push({ kind: 'error',   title, message, ttl: 6000 }),
    dismiss
  }), [push, dismiss]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[92vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'animate-slideup rounded-xl shadow-lg border px-4 py-3 bg-white flex items-start gap-3 ' +
              (t.kind === 'success' ? 'border-emerald-200' :
               t.kind === 'error'   ? 'border-red-200' :
               t.kind === 'warning' ? 'border-amber-200' :
                                      'border-slate-200')
            }
          >
            <div className={
              'mt-1 h-2.5 w-2.5 rounded-full ' +
              (t.kind === 'success' ? 'bg-emerald-500' :
               t.kind === 'error'   ? 'bg-red-500' :
               t.kind === 'warning' ? 'bg-amber-500' :
                                      'bg-brand-500')
            } />
            <div className="flex-1">
              <div className="font-semibold text-sm">{t.title}</div>
              {t.message ? <div className="text-xs text-slate-600 mt-0.5">{t.message}</div> : null}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700">&times;</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() { return useContext(ToastCtx); }

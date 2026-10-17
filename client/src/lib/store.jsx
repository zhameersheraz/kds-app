// Auth context. Persists token+user in localStorage so a reload keeps the
// session alive on a tablet/phone.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { connectSocket, disconnectSocket } from './socket';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('kds_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { user } = await api.me();
        if (!cancelled) {
          setUser(user);
          connectSocket(token);
        }
      } catch (e) {
        // Only a rejected token means "log out". This used to clear localStorage
        // on any failure at all, so a 429, a 500 or a dropped connection threw
        // away a perfectly valid 12 hour session and bounced staff to the
        // landing page. A token the server refused is a 401 or 403; everything
        // else is a transient fault and the token is still good.
        const rejected = e && (e.status === 401 || e.status === 403);
        if (!cancelled && rejected) {
          localStorage.removeItem('kds_token');
          setToken(null);
          setUser(null);
        }
        if (!cancelled && !rejected) {
          console.warn('[auth] could not verify session, keeping the stored token', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    async login(username, password) {
      const { token, user } = await api.login(username, password);
      localStorage.setItem('kds_token', token);
      setToken(token);
      setUser(user);
      connectSocket(token);
      return user;
    },
    async signup(name, username, password, role) {
      const { token, user } = await api.signup(name, username, password, role);
      localStorage.setItem('kds_token', token);
      setToken(token);
      setUser(user);
      connectSocket(token);
      return user;
    },
    logout() {
      localStorage.removeItem('kds_token');
      setToken(null);
      setUser(null);
      disconnectSocket();
    }
  }), [user, token, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
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
      } catch (_) {
        localStorage.removeItem('kds_token');
        if (!cancelled) { setToken(null); setUser(null); }
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
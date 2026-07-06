// App shell - handles auth gating, role routing, currency provider.

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/store';
import { ToastProvider } from './lib/toast';
import { CurrencyProvider } from './lib/currency';

import Login from './pages/Login';
import Signup from './pages/Signup';
import POS from './pages/POS';
import KDS from './pages/KDS';
import Admin from './pages/Admin';
import ServerStatus from './pages/ServerStatus';

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/login" replace />;
  return children;
}

function FullScreenSpinner() {
  return (
    <div className="h-screen w-screen flex items-center justify-center opacity-40">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'kitchen') return <Navigate to="/kds" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin" replace />;
  return <Navigate to="/pos" replace />;
}

export default function App() {
  return (
    <CurrencyProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/"            element={<HomeRedirect />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/signup"      element={<Signup />} />

            <Route path="/pos"         element={
              <RequireAuth roles={['server','admin']}><POS /></RequireAuth>
            }/>
            <Route path="/server-status" element={
              <RequireAuth roles={['server','admin']}><ServerStatus /></RequireAuth>
            }/>

            <Route path="/kds"         element={
              <RequireAuth roles={['kitchen','admin']}><KDS /></RequireAuth>
            }/>

            <Route path="/admin"       element={
              <RequireAuth roles={['admin']}><Admin /></RequireAuth>
            }/>

            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </CurrencyProvider>
  );
}
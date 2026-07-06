// Tiny fetch wrapper. Adds the JWT if present and surfaces server errors.

const API = '/api';

function token() {
  return localStorage.getItem('kds_token') || null;
}

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`${API}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'omit'
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const err = new Error(data?.error || `http_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  login:     (username, password) => request('/auth/login',  { method: 'POST', body: { username, password } }),
  signup:    (name, username, password, role) => request('/auth/signup', { method: 'POST', body: { name, username, password, role } }),
  me:        ()                  => request('/auth/me'),
  // menu
  listMenu:  () => request('/menu'),
  // orders
  createOrder: (payload)        => request('/orders',         { method: 'POST', body: payload }),
  activeOrders:()               => request('/orders/active'),
  myOrders:    ()               => request('/orders/mine'),
  allOrders:   (status, limit)  => request(`/orders/all?status=${status || ''}&limit=${limit || 200}`),
  setStatus:   (id, status)     => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  // reports
  sales: () => request('/reports/sales'),
  summary: () => request('/reports/summary')
};
// Format helpers. Money formatting lives in lib/currency.jsx (uses context).

export function elapsedLabel(isoStart, isoEnd) {
  if (!isoStart) return '00:00';
  const start = new Date(isoStart.replace(' ', 'T') + 'Z').getTime();
  const end = isoEnd ? new Date(isoEnd.replace(' ', 'T') + 'Z').getTime() : Date.now();
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function waitBucket(isoStart) {
  const sec = Math.floor((Date.now() - new Date(isoStart.replace(' ', 'T') + 'Z').getTime()) / 1000);
  if (sec < 5 * 60)  return 'fresh';
  if (sec < 10 * 60) return 'warm';
  return 'late';
}

export function statusLabel(s) {
  return ({
    pending:   'Pending',
    preparing: 'Preparing',
    ready:     'Ready',
    served:    'Served',
    cancelled: 'Cancelled'
  })[s] || s;
}

export function clockNow() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function shortDate() {
  const d = new Date();
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
// Socket.IO singleton.
// Connects once the user is logged in; reconnects automatically.
// Exposes a simple pub/sub used by useSocketEvent().

import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io({
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect',    () => console.log('[ws] connected', socket.id));
  socket.on('disconnect', (r) => console.log('[ws] disconnected', r));
  socket.on('connect_error', (e) => console.warn('[ws] error', e.message));

  // Re-join role-based rooms after a reconnect.
  socket.on('connect', () => socket.emit('subscribe'));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() { return socket; }

export function onSocketEvent(event, handler) {
  const s = getSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
}

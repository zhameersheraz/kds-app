import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { preserveSymlinks: false },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Forward API + Socket.IO to the Node backend, so the same origin works
      // when dev-ing on a phone.
      '/api':    { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:4000', changeOrigin: true, ws: true }
    }
  }
});

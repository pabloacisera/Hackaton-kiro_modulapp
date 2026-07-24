import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  plugins: [react()],
  // Always served under /admin/ — both in prod build (reverse proxy) and in
  // dev (Vite dev server referencing HMR client under /admin/@vite/client
  // so the reverse proxy passes it through unchanged). Direct access still
  // works at http://localhost:3001/admin/.
  base: '/admin/',
  server: {
    host: '0.0.0.0',
    // Container dev overrides via VITE_PORT so vite can bind port 80 to match
    // the parent compose port mapping and reverse-proxy upstream.
    port: Number(process.env.VITE_PORT) || 3001,
    strictPort: true,
  },
  preview: {
    port: 3001,
    strictPort: true,
  },
}));

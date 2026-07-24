import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    // Container dev overrides via VITE_PORT so vite can bind port 80 to match
    // the parent compose port mapping and reverse-proxy upstream.
    port: Number(process.env.VITE_PORT) || 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
});

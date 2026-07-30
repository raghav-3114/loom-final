/**
 * @file vite.config.js
 * @description Vite configuration for Loom AI web client.
 * Configures React plugin, Tailwind CSS Vite plugin, and API reverse proxy for backend communication.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});

import { defineConfig } from 'vite';

/**
 * Dev : même origine que le front → /api est proxifié vers Express (3001).
 * Évite les échecs « Failed to fetch » (navigateur intégré, IPv4/IPv6, CORS).
 */
export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
});

import { defineConfig } from 'vite';
import { CONTENT_SECURITY_POLICY, cspForHtmlMetaAttribute } from './csp.mjs';

/**
 * Injecte la CSP uniquement en build (évite de casser le HMR / eval Vite en dev).
 */
function qhseCspIndexHtmlPlugin() {
  return {
    name: 'qhse-csp-index-html',
    transformIndexHtml(html, ctx) {
      if (ctx.server) return html;
      const content = cspForHtmlMetaAttribute();
      const meta = `    <meta http-equiv="Content-Security-Policy" content="${content}" />\n`;
      return html.replace(/<head>/i, `<head>\n${meta}`);
    }
  };
}

/**
 * Dev : même origine que le front → /api est proxifié vers Express (3001).
 * Évite les échecs « Failed to fetch » (navigateur intégré, IPv4/IPv6, CORS).
 */
export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [qhseCspIndexHtmlPlugin()],
  server: {
    port: 5173,
    /** Si 5173 est déjà pris (ancienne instance Vite), utiliser 5174, 5175… */
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    headers: {
      'Content-Security-Policy': CONTENT_SECURITY_POLICY
    }
  }
});

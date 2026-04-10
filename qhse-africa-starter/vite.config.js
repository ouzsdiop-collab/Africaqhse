import { defineConfig, loadEnv } from 'vite';
import {
  buildContentSecurityPolicy,
  cspForHtmlMetaAttribute,
  DEFAULT_PROD_API_ORIGINS
} from './csp.mjs';

/**
 * Injecte la CSP uniquement en build (évite de casser le HMR / eval Vite en dev).
 * @param {string} policy
 */
function qhseCspIndexHtmlPlugin(policy) {
  return {
    name: 'qhse-csp-index-html',
    transformIndexHtml(html, ctx) {
      if (ctx.server) return html;
      const content = cspForHtmlMetaAttribute(policy);
      const meta = `    <meta http-equiv="Content-Security-Policy" content="${content}" />\n`;
      return html.replace(/<head>/i, `<head>\n${meta}`);
    }
  };
}

function connectOriginsFromEnv(env) {
  const raw = env.VITE_API_BASE?.trim();
  if (!raw) return [];
  try {
    return [new URL(raw).origin];
  } catch {
    return [];
  }
}

/**
 * @param {string} id
 */
function normalizeModuleId(id) {
  return id.split('\\').join('/');
}

/**
 * Dev : même origine que le front → /api est proxifié vers Express (3001).
 * Évite les échecs « Failed to fetch » (navigateur intégré, IPv4/IPv6, CORS).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /* Toujours autoriser l’API prod dans la meta CSP, même si seul window.__QHSE_API_BASE__
     est utilisé à l’exécution ou si VITE_API_BASE n’est pas chargé dans l’environnement du build. */
  const apiConnectOrigins = [...DEFAULT_PROD_API_ORIGINS, ...connectOriginsFromEnv(env)];
  const policy = buildContentSecurityPolicy(apiConnectOrigins);

  return {
    root: '.',
    publicDir: 'public',
    plugins: [qhseCspIndexHtmlPlugin(policy)],
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
        'Content-Security-Policy': policy
      }
    },
    build: {
      cssCodeSplit: true,
      chunkSizeWarningLimit: 400,
      sourcemap: mode === 'production' ? false : true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const n = normalizeModuleId(id);
            if (n.includes('chart.js')) return 'vendor-charts';
            if (n.includes('html2pdf') || n.includes('pdfkit')) return 'vendor-pdf';
            if (n.includes('xlsx')) return 'vendor-xlsx';
            if (n.includes('@sentry')) return 'vendor-sentry';
            if (n.includes('src/pages/dashboard')) return 'page-dashboard';
            if (n.includes('src/pages/incidents')) return 'page-incidents';
            if (n.includes('src/pages/audits')) return 'page-audits';
            if (n.includes('src/pages/iso')) return 'page-iso';
            if (n.includes('src/pages/analytics')) return 'page-analytics';
            if (n.includes('src/components/dashboard')) return 'chunk-dashboard-components';
            return undefined;
          }
        }
      }
    }
  };
});

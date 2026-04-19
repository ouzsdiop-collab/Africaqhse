import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} id
 */
function normalizeModuleId(id) {
  return id.split('\\').join('/');
}

/**
 * Dev : même origine que le front → /api est proxifié vers Express (3001).
 * Évite les échecs « Failed to fetch » (navigateur intégré, IPv4/IPv6, CORS).
 *
 * CSP : gérée côté API (Helmet), pas de meta ni d’en-tête CSP injectés par Vite.
 *
 * Analyse bundle : `npm run build:analyze` → `dist/stats.html` (treemap gzip/brotli).
 */
export default defineConfig(({ mode }) => {
  const analyze = mode === 'analyze';

  return {
    resolve: {
      alias: {
        canvg: path.resolve(__dirname, 'src/stubs/canvg-shim.js')
      }
    },
    root: '.',
    /** Chemins relatifs dans dist/ → évite les 404 des /assets/* si l’app n’est pas servie à la racine (ex. Railway / sous-chemin). */
    base: './',
    publicDir: 'public',
    plugins: analyze
      ? [
          visualizer({
            filename: 'dist/stats.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
            open: process.env.CI !== 'true'
          })
        ]
      : [],
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
    build: {
      cssCodeSplit: true,
      chunkSizeWarningLimit: 450,
      sourcemap: mode === 'production' && !analyze ? false : true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const n = normalizeModuleId(id);
            if (n.includes('node_modules')) {
              if (n.includes('/chart.js/') || n.includes('\\chart.js\\')) return 'charts';
              if (n.includes('jspdf')) return 'vendor-pdf-jspdf';
              if (n.includes('/pdfkit/') || n.includes('\\pdfkit\\')) return 'vendor-pdf-pdfkit';
              if (n.includes('@sentry')) return 'vendor-sentry';
              return undefined;
            }
            /** Registres / gabarits PDF navigateur — regroupé pour éviter cycle Rollup page-incidents ↔ vendor-pdf. */
            if (
              n.includes('src/services/qhseReportsPdf.service') ||
              n.includes('src/utils/qhsePdfChrome') ||
              n.includes('src/utils/html2pdfExport')
            ) {
              return 'chunk-qhse-pdf-reports';
            }
            /** Alias `canvg` → shim ; même chunk que jsPDF pour éviter un fichier async séparé (~1 requête en moins). */
            if (n.includes('src/stubs/canvg-shim')) return 'vendor-pdf-jspdf';
            if (n.includes('src/pages/dashboard')) return 'page-dashboard';
            if (n.includes('src/pages/incidents')) return 'page-incidents';
            if (n.includes('src/pages/audits')) return 'page-audits';
            if (n.includes('src/pages/iso')) return 'page-iso';
            if (n.includes('src/pages/analytics')) return 'page-analytics';
            if (n.includes('src/pages/actions')) return 'page-actions';
            if (n.includes('src/pages/risks')) return 'page-risks';
            if (n.includes('src/pages/habilitations')) return 'page-habilitations';
            if (n.includes('src/pages/imports')) return 'page-imports';
            if (n.includes('src/pages/performance')) return 'page-performance';
            if (n.includes('src/pages/activity-log')) return 'page-activity-log';
            if (n.includes('src/pages/products')) return 'page-products';
            if (n.includes('src/pages/permits')) return 'page-permits';
            if (n.includes('src/pages/settings')) return 'page-settings';
            if (n.includes('src/pages/ai-center')) return 'page-ai-center';
            if (n.includes('src/pages/sites')) return 'page-sites';
            if (n.includes('src/components/dashboardCharts')) return 'charts';
            if (
              n.includes('src/components/auditExpertUx') ||
              n.includes('src/components/auditFormDialog') ||
              n.includes('src/components/auditResultPanel') ||
              n.includes('src/components/auditFieldMode') ||
              n.includes('src/components/auditDocumentComplianceStrip')
            ) {
              return 'audit-expert';
            }
            if (n.includes('src/components/dashboard')) return 'chunk-dashboard-components';
            return undefined;
          }
        }
      }
    }
  };
});

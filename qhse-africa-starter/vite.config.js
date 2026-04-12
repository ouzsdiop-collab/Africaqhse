import { defineConfig } from 'vite';

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
 */
export default defineConfig(({ mode }) => ({
  root: '.',
  /** Chemins relatifs dans dist/ → évite les 404 des /assets/* si l’app n’est pas servie à la racine (ex. Railway / sous-chemin). */
  base: './',
  publicDir: 'public',
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
    chunkSizeWarningLimit: 400,
    sourcemap: mode === 'production' ? false : true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const n = normalizeModuleId(id);
          if (n.includes('node_modules')) {
            if (n.includes('/chart.js/') || n.includes('\\chart.js\\')) return 'charts';
            if (n.includes('/xlsx/') || n.includes('\\xlsx\\')) return 'vendor-xlsx';
            if (
              n.includes('html2pdf') ||
              n.includes('jspdf') ||
              n.includes('/pdfkit/') ||
              n.includes('\\pdfkit\\') ||
              n.includes('canvg')
            ) {
              return 'vendor-pdf';
            }
            if (n.includes('@sentry')) return 'vendor-sentry';
            return undefined;
          }
          if (n.includes('src/pages/dashboard')) return 'page-dashboard';
          if (n.includes('src/pages/incidents')) return 'page-incidents';
          if (n.includes('src/pages/audits')) return 'page-audits';
          if (n.includes('src/pages/iso')) return 'page-iso';
          if (n.includes('src/pages/analytics')) return 'page-analytics';
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
          if (n.includes('src/utils/html2pdfExport')) return 'vendor-pdf';
          if (n.includes('src/components/auditPremiumSaaS.pdf')) return 'vendor-pdf';
          if (n.includes('src/components/dashboard')) return 'chunk-dashboard-components';
          return undefined;
        }
      }
    }
  }
}));

import puppeteer from 'puppeteer-core';

/** @type {Promise<import('puppeteer-core').Browser> | null} */
let browserPromise = null;

function executablePath() {
  return (
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/usr/bin/chromium-browser'
  );
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        executablePath: executablePath(),
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }
  const browser = await browserPromise;
  if (!browser.isConnected()) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

function isBrowserCrashError(err) {
  const msg = String(err && err.message ? err.message : err || '');
  return /Target closed|Session closed|Protocol error|Connection closed|Navigating frame was detached|Browser has disconnected/i.test(
    msg
  );
}

/**
 * Rend un document HTML autonome en PDF via Chromium headless (Puppeteer).
 * @param {string} html
 * @param {{
 *   format?: string;
 *   landscape?: boolean;
 *   margin?: { top?: string; right?: string; bottom?: string; left?: string };
 *   headerTemplate?: string;
 *   footerTemplate?: string;
 * }} [opts]
 * @returns {Promise<Buffer>}
 */
export async function renderHtmlToPdf(html, opts = {}) {
  try {
    return await renderOnce(html, opts);
  } catch (err) {
    if (!isBrowserCrashError(err)) throw err;
    // Le navigateur partagé a planté/perdu son contexte : on le recycle et on retente une fois.
    console.warn('[pdfRenderer] browser crash detected, recycling and retrying:', err.message);
    browserPromise = null;
    return renderOnce(html, opts);
  }
}

async function renderOnce(html, opts) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const hasTemplates = Boolean(opts.headerTemplate || opts.footerTemplate);

    const defaultMargin = hasTemplates
      ? { top: '20mm', right: '14mm', bottom: '16mm', left: '14mm' }
      : { top: '15mm', right: '14mm', bottom: '15mm', left: '14mm' };

    const pdfOpts = {
      format: opts.format || 'A4',
      landscape: Boolean(opts.landscape),
      printBackground: true,
      margin: opts.margin || defaultMargin,
    };

    if (hasTemplates) {
      pdfOpts.displayHeaderFooter = true;
      pdfOpts.headerTemplate = opts.headerTemplate || '<div></div>';
      pdfOpts.footerTemplate = opts.footerTemplate || '<div></div>';
    }

    const pdf = await page.pdf(pdfOpts);
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

export async function closePdfRenderer() {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  if (browser) await browser.close().catch(() => {});
}

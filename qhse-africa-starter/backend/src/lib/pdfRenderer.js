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

/**
 * Rend un document HTML autonome en PDF via Chromium headless (Puppeteer).
 * @param {string} html · document HTML complet (avec <style>)
 * @param {{ format?: string; landscape?: boolean; margin?: { top?: string; right?: string; bottom?: string; left?: string } }} [opts]
 * @returns {Promise<Buffer>}
 */
export async function renderHtmlToPdf(html, opts = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdfOpts = {
      format: opts.format || 'A4',
      landscape: Boolean(opts.landscape),
      printBackground: true,
      margin: opts.margin || { top: '20mm', right: '15mm', bottom: '18mm', left: '15mm' },
    };
    if (opts.displayHeaderFooter) {
      pdfOpts.displayHeaderFooter = true;
      // Puppeteer header/footer : font-size doit être en px (défaut = 0)
      pdfOpts.headerTemplate = opts.headerTemplate || '<span></span>';
      pdfOpts.footerTemplate = opts.footerTemplate || '<span></span>';
      // Marges plus grandes pour laisser la place au header/footer
      pdfOpts.margin = opts.margin || { top: '26mm', right: '15mm', bottom: '20mm', left: '15mm' };
    }
    const pdf = await page.pdf(pdfOpts);
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closePdfRenderer() {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  if (browser) await browser.close().catch(() => {});
}

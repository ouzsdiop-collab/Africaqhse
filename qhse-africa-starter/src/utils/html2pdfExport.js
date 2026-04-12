/**
 * Options html2pdf.js partagées — netteté, capture DOM hors viewport, styles résolus sur le clone.
 * @param {string} filename
 * @param {Record<string, unknown>} [overrides]
 * @returns {Record<string, unknown>}
 */

/** @param {Document} doc */
function qhseDefaultHtml2CanvasOnClone(doc) {
  if (!doc?.querySelectorAll) return;
  doc.querySelectorAll('[hidden]').forEach((el) => el.removeAttribute('hidden'));
  doc.querySelectorAll('[style]').forEach((el) => {
    const st = el.getAttribute('style') || '';
    if (/display\s*:\s*none/i.test(st)) {
      try {
        el.style.display = 'block';
      } catch {
        /* ignore */
      }
    }
  });
}

/**
 * Si l’élément n’est pas dans le document, l’attacher temporairement pour html2canvas.
 * @param {HTMLElement} element
 * @returns {Promise<HTMLDivElement | null>} wrapper à retirer après capture, ou null
 */
export async function prepareElementForCapture(element) {
  const isInDom = document.body.contains(element);
  let wrapper = null;

  if (!isInDom) {
    wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 794px;
      min-height: 200px;
      z-index: -1;
      background: #ffffff;
      visibility: visible;
      opacity: 1;
    `;
    wrapper.appendChild(element);
    document.body.appendChild(wrapper);
  }

  element.getBoundingClientRect();
  await new Promise((r) => setTimeout(r, 300));

  return wrapper;
}

/**
 * @param {HTMLDivElement | null} wrapper
 */
export async function cleanupAfterCapture(wrapper) {
  if (wrapper && document.body.contains(wrapper)) {
    document.body.removeChild(wrapper);
  }
}

/**
 * @param {Document} clonedDoc
 */
function qhseInlineComputedStylesOnClone(clonedDoc) {
  const view = clonedDoc.defaultView || window;
  try {
    clonedDoc.querySelectorAll('*').forEach((el) => {
      try {
        const computed = view.getComputedStyle(el);
        if (computed.color) el.style.color = computed.color;
        if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          el.style.backgroundColor = computed.backgroundColor;
        }
        if (computed.fontSize) el.style.fontSize = computed.fontSize;
        if (computed.fontFamily) el.style.fontFamily = computed.fontFamily;
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
  clonedDoc.querySelectorAll('script, iframe, video, canvas').forEach((el) => el.remove());
  if (clonedDoc.body) {
    clonedDoc.body.style.backgroundColor = '#ffffff';
    clonedDoc.body.style.color = '#000000';
  }
}

export function buildHtml2PdfOptions(filename, overrides = {}) {
  const {
    html2canvas: html2canvasUser,
    jsPDF: jsPDFUser,
    image: imageUser,
    ...restOverrides
  } = overrides;

  const baseHtml2Canvas = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    removeContainer: true,
    foreignObjectRendering: false,
    windowWidth: 794
  };

  const mergedCanvas =
    html2canvasUser && typeof html2canvasUser === 'object'
      ? { ...baseHtml2Canvas, ...html2canvasUser }
      : { ...baseHtml2Canvas };

  const userOnClone = typeof mergedCanvas.onclone === 'function' ? mergedCanvas.onclone : null;
  mergedCanvas.onclone = (clonedDoc, ...args) => {
    qhseDefaultHtml2CanvasOnClone(clonedDoc);
    qhseInlineComputedStylesOnClone(clonedDoc);
    userOnClone?.(clonedDoc, ...args);
  };

  const safeName = filename || 'rapport-qhse.pdf';
  const base = {
    margin: [10, 10, 10, 10],
    filename: safeName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: mergedCanvas,
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  const out = { ...base, ...restOverrides };
  out.filename = restOverrides.filename != null ? restOverrides.filename : safeName;
  out.html2canvas = mergedCanvas;
  if (jsPDFUser && typeof jsPDFUser === 'object') {
    out.jsPDF = { ...base.jsPDF, ...jsPDFUser };
  }
  if (imageUser && typeof imageUser === 'object') {
    out.image = { ...base.image, ...imageUser };
  }
  return out;
}

function waitForPaintAndLayout() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 500);
      });
    });
  });
}

/**
 * html2canvas capture mal les canvas (Chart.js, etc.) — rasterisation PNG avant capture.
 * @param {HTMLElement} root
 */
export function replaceCanvasesWithDataUrlImages(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll('canvas').forEach((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const parent = canvas.parentNode;
    if (!parent) return;
    let dataUrl = '';
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch {
      return;
    }
    if (!dataUrl || dataUrl === 'data:,') return;
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = '';
    img.style.width = canvas.style.width || `${canvas.offsetWidth}px`;
    img.style.height = canvas.style.height || `${canvas.offsetHeight}px`;
    if (canvas.style.display) img.style.display = canvas.style.display;
    parent.replaceChild(img, canvas);
  });
}

/**
 * @param {HTMLElement} element
 * @param {string} filename
 * @param {Record<string, unknown>} [overrides]
 */
export async function saveElementAsPdf(element, filename, overrides = {}) {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('saveElementAsPdf: élément HTML invalide');
  }

  const wrapper = await prepareElementForCapture(element);

  const inline = element.style;
  const snapshot = {
    position: inline.position,
    left: inline.left,
    top: inline.top,
    width: inline.width,
    maxWidth: inline.maxWidth,
    maxHeight: inline.maxHeight,
    overflow: inline.overflow,
    opacity: inline.opacity,
    visibility: inline.visibility,
    display: inline.display,
    pointerEvents: inline.pointerEvents,
    zIndex: inline.zIndex
  };

  const cs = getComputedStyle(element);
  const leftStr = `${inline.left || ''} ${cs.left}`;
  const offViewport = /-9999/.test(leftStr);
  const hiddenDisplay = cs.display === 'none';
  const hiddenVis = cs.visibility === 'hidden';
  const zeroOp = Number.parseFloat(cs.opacity) === 0;

  try {
    if (hiddenDisplay) {
      inline.display = 'block';
    }
    if (hiddenVis) {
      inline.visibility = 'visible';
    }
    if (offViewport || zeroOp) {
      inline.position = 'fixed';
      inline.left = '0';
      inline.top = '0';
      if (!inline.width) inline.width = cs.width && cs.width !== 'auto' ? cs.width : '210mm';
      inline.maxWidth = '100vw';
      /* Pas de max-height / scroll : html2canvas ne rasterise souvent que la zone visible → PDF blanc */
      inline.maxHeight = 'none';
      inline.overflow = 'visible';
      inline.opacity = '1';
      inline.visibility = 'visible';
      inline.pointerEvents = 'none';
      inline.zIndex = '2147483646';
      if (!inline.backgroundColor) inline.backgroundColor = '#ffffff';
      inline.color = '#000000';
    } else if (Number.parseFloat(cs.opacity) < 1) {
      inline.opacity = '1';
    }

    replaceCanvasesWithDataUrlImages(element);

    await waitForPaintAndLayout();

    const sw = Math.max(794, Math.ceil(element.scrollWidth || element.getBoundingClientRect().width || 794));
    const sh = Math.max(400, Math.ceil(element.scrollHeight || element.getBoundingClientRect().height || 1123));
    const canvasHint = {
      width: sw,
      height: sh,
      windowWidth: sw,
      windowHeight: sh
    };
    const mergedOverrides =
      overrides && typeof overrides.html2canvas === 'object'
        ? {
            ...overrides,
            html2canvas: { ...canvasHint, ...overrides.html2canvas }
          }
        : { ...overrides, html2canvas: canvasHint };

    const mod = await import('html2pdf.js');
    const html2pdf = mod.default || mod;
    const opt = buildHtml2PdfOptions(filename, mergedOverrides);
    await html2pdf().set(opt).from(element).save();
  } finally {
    Object.keys(snapshot).forEach((k) => {
      inline[k] = snapshot[k];
    });
    await cleanupAfterCapture(wrapper);
  }
}

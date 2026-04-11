/**
 * Options html2pdf.js partagées — netteté et coupure de page plus stables.
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
    letterRendering: true,
    logging: false,
    scrollY: 0,
    scrollX: 0,
    backgroundColor: '#ffffff'
  };

  const mergedCanvas =
    html2canvasUser && typeof html2canvasUser === 'object'
      ? { ...baseHtml2Canvas, ...html2canvasUser }
      : { ...baseHtml2Canvas };

  const userOnClone = typeof mergedCanvas.onclone === 'function' ? mergedCanvas.onclone : null;
  mergedCanvas.onclone = (clonedDoc, ...args) => {
    qhseDefaultHtml2CanvasOnClone(clonedDoc);
    userOnClone?.(clonedDoc, ...args);
  };

  const base = {
    margin: [10, 12, 12, 12],
    filename,
    image: { type: 'jpeg', quality: 0.97 },
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
 * @param {HTMLElement} element
 * @param {string} filename
 * @param {Record<string, unknown>} [overrides]
 */
export async function saveElementAsPdf(element, filename, overrides = {}) {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('saveElementAsPdf: élément HTML invalide');
  }
  if (!element.isConnected || !document.body.contains(element)) {
    throw new Error("saveElementAsPdf: l'élément doit être dans le document");
  }

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
      inline.maxHeight = '100vh';
      inline.overflow = 'auto';
      inline.opacity = '1';
      inline.visibility = 'visible';
      inline.pointerEvents = 'none';
      inline.zIndex = '2147483646';
    } else if (Number.parseFloat(cs.opacity) < 1) {
      inline.opacity = '1';
    }

    await waitForPaintAndLayout();

    const mod = await import('html2pdf.js');
    const html2pdf = mod.default || mod;
    const opt = buildHtml2PdfOptions(filename, overrides);
    await html2pdf().set(opt).from(element).save();
  } finally {
    Object.keys(snapshot).forEach((k) => {
      inline[k] = snapshot[k];
    });
  }
}

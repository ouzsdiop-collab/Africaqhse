import { escapeHtml } from '../utils/escapeHtml.js';

const STYLE_ID = 'qhse-audit-result-dialog-styles';

function ensureAuditResultDialogStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
.qhse-audit-result-dialog{border:none;border-radius:14px;max-width:min(520px,96vw);max-height:min(90vh,800px);padding:0;background:var(--bg,#0f172a);color:var(--text);box-shadow:0 24px 64px rgba(0,0,0,.55)}
.qhse-audit-result-dialog::backdrop{background:rgba(0,0,0,.55)}
.qhse-audit-result-dialog__toolbar{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:12px 14px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.qhse-audit-result-dialog__body{padding:14px 18px 20px;overflow:auto;max-height:min(82vh,760px)}
.qhse-audit-result-dialog__score{font-size:28px;font-weight:800;margin:8px 0}
.qhse-audit-result-dialog__meta{display:grid;gap:8px;font-size:13px;color:var(--text2)}
`;
  document.head.append(el);
}

/**
 * Panneau modal — score et métadonnées d’un audit (lecture).
 *
 * @param {object} audit
 * @param {{ onEdit?: (a: object) => void; onClose?: () => void }} [opts]
 */
export function openAuditResult(audit, opts = {}) {
  const { onEdit, onClose } = opts;
  ensureAuditResultDialogStyles();
  const dlg = document.createElement('dialog');
  dlg.className = 'qhse-audit-result-dialog';
  const toolbar = document.createElement('div');
  toolbar.className = 'qhse-audit-result-dialog__toolbar';
  if (typeof onEdit === 'function') {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-primary';
    editBtn.textContent = 'Modifier';
    editBtn.addEventListener('click', () => onEdit(audit));
    toolbar.append(editBtn);
  }
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-secondary';
  closeBtn.textContent = 'Fermer';
  closeBtn.addEventListener('click', () => dlg.close());
  toolbar.append(closeBtn);

  const body = document.createElement('div');
  body.className = 'qhse-audit-result-dialog__body';
  const ref = audit?.ref != null ? String(audit.ref) : '—';
  const site = audit?.site != null ? String(audit.site) : '—';
  const score =
    audit?.score != null && audit.score !== '' ? String(audit.score) : '—';
  const status = audit?.conforme === true ? 'Conforme' : audit?.conforme === false ? 'Non conforme' : '—';
  const date = audit?.date != null ? String(audit.date) : '—';
  const auditeur = audit?.auditeur != null ? String(audit.auditeur) : '—';
  body.innerHTML = `
    <p class="section-kicker">Résultat audit</p>
    <h2 style="margin:0 0 8px;font-size:18px">${escapeHtml(ref)}</h2>
    <div class="qhse-audit-result-dialog__score">${escapeHtml(score)}${score !== '—' ? '%' : ''}</div>
    <div class="qhse-audit-result-dialog__meta">
      <div><strong>Site</strong> — ${escapeHtml(site)}</div>
      <div><strong>Auditeur</strong> — ${escapeHtml(auditeur)}</div>
      <div><strong>Date</strong> — ${escapeHtml(date)}</div>
      <div><strong>Synthèse</strong> — ${escapeHtml(status)}</div>
    </div>
  `;

  dlg.append(toolbar, body);
  document.body.append(dlg);
  dlg.addEventListener('close', () => {
    onClose?.();
    dlg.remove();
  });
  dlg.showModal();
}

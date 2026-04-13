import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
const PAGE_STYLE_ID = 'qhse-audit-logs-api-styles';

function ensureAuditLogsApiStyles() {
  if (document.getElementById(PAGE_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = PAGE_STYLE_ID;
  el.textContent = `
.audit-logs-api-page .audit-logs-api-toolbar{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:16px}
.audit-logs-api-page .audit-logs-api-table{width:100%;border-collapse:collapse;font-size:13px}
.audit-logs-api-page .audit-logs-api-table th,.audit-logs-api-page .audit-logs-api-table td{border:1px solid var(--color-border);padding:8px 10px;text-align:left;vertical-align:top}
.audit-logs-api-page .audit-logs-api-table th{background:var(--color-subtle);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.04em}
.audit-logs-api-page .audit-logs-api-meta{max-width:280px;word-break:break-word;font-family:ui-monospace,monospace;font-size:11px;color:var(--color-text-muted)}
.audit-logs-api-page .audit-logs-api-load{margin-top:16px}
`;
  document.head.append(el);
}

/** @param {unknown} v */
function previewJson(v) {
  if (v == null) return '—';
  try {
    const s = JSON.stringify(v);
    return s.length > 220 ? `${s.slice(0, 220)}…` : s;
  } catch {
    return String(v);
  }
}

/**
 * Panneau « journal serveur » (API) — intégré dans la page Journal unifiée.
 * @returns {HTMLElement} article.content-card ou équivalent
 */
export function createAuditLogsServerPanel() {
  ensureAuditLogsApiStyles();
  const su = getSessionUser();
  const wrap = document.createElement('div');
  wrap.className = 'audit-logs-api-page';

  if (!su || !canResource(su.role, 'audit_logs', 'read')) {
    const card = document.createElement('article');
    card.className = 'content-card card-soft';
    card.innerHTML = `
      <h3 class="page-title-like" style="margin-top:0">Journal serveur (API)</h3>
      <p class="dashboard-muted-lead">Votre profil ne permet pas d’accéder aux entrées d’audit enregistrées côté serveur.</p>
      <p class="dashboard-muted-lead" style="margin-top:8px">Utilisez l’onglet « Session navigateur » pour la piste d’activité locale.</p>`;
    wrap.append(card);
    return wrap;
  }

  const card = document.createElement('article');
  card.className = 'content-card card-soft';

  const head = document.createElement('header');
  head.innerHTML = `
    <p class="settings-section__kicker">Traçabilité · API</p>
    <h3 class="page-title-like">Journal serveur (API)</h3>
    <p class="dashboard-muted-lead">
      Entrées persistées par l’API (actions sensibles, imports, documents, etc.). Complète la piste « session navigateur ».
    </p>`;

  const toolbar = document.createElement('div');
  toolbar.className = 'audit-logs-api-toolbar';

  const isAdmin = String(su.role || '').toUpperCase() === 'ADMIN';
  let tenantFilter = '';
  if (isAdmin) {
    const lab = document.createElement('label');
    lab.className = 'field';
    const labSpan = document.createElement('span');
    labSpan.textContent = 'Filtrer par tenant (id)';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'control-input';
    inp.placeholder = 'laisser vide = tous';
    inp.addEventListener('change', () => {
      tenantFilter = inp.value.trim();
    });
    lab.append(labSpan, inp);
    toolbar.append(lab);
  }

  const statusEl = document.createElement('p');
  statusEl.className = 'dashboard-muted-lead';
  statusEl.style.margin = '0';
  statusEl.setAttribute('role', 'status');

  const tableHost = document.createElement('div');
  tableHost.style.overflowX = 'auto';

  const loadMore = document.createElement('button');
  loadMore.type = 'button';
  loadMore.className = 'btn btn-secondary audit-logs-api-load';
  loadMore.textContent = 'Charger plus';
  loadMore.hidden = true;

  let skip = 0;
  const take = 40;
  let total = 0;
  let loading = false;

  /** @param {Record<string, unknown>} row */
  /** Libellé lisible pour quelques actions métier (sinon valeur brute). */
  function formatAuditAction(resource, action) {
    const a = String(action ?? '');
    if (resource === 'users' && a === 'remove_from_tenant') {
      return 'Retrait membre (organisation)';
    }
    return a;
  }

  function buildRow(row, admin) {
    const tr = document.createElement('tr');
    const tdDate = document.createElement('td');
    tdDate.textContent = row.createdAt ? String(row.createdAt) : '—';
    tr.append(tdDate);
    if (admin) {
      const tdTenant = document.createElement('td');
      tdTenant.textContent = row.tenantId != null ? String(row.tenantId) : '—';
      tr.append(tdTenant);
    }
    const u = row.user && typeof row.user === 'object' ? row.user : null;
    const uName = u && typeof u.name === 'string' ? u.name : '';
    const uEmail = u && typeof u.email === 'string' ? u.email : '';
    const who = uName || uEmail || (row.userId ? String(row.userId) : '—');
    const tdRes = document.createElement('td');
    tdRes.textContent = String(row.resource ?? '');
    const tdRid = document.createElement('td');
    tdRid.textContent = String(row.resourceId ?? '');
    const tdAct = document.createElement('td');
    tdAct.textContent = formatAuditAction(row.resource, row.action);
    const tdWho = document.createElement('td');
    tdWho.textContent = who;
    const tdMeta = document.createElement('td');
    tdMeta.className = 'audit-logs-api-meta';
    tdMeta.textContent = previewJson(row.metadata);
    tr.append(tdRes, tdRid, tdAct, tdWho, tdMeta);
    return tr;
  }

  async function fetchPage(append) {
    if (loading) return;
    if (!append) {
      skip = 0;
    }
    loading = true;
    statusEl.textContent = 'Chargement…';
    try {
      const qs = new URLSearchParams({ take: String(take), skip: String(skip) });
      if (isAdmin && tenantFilter) qs.set('tenantId', tenantFilter);
      const res = await qhseFetch(`/api/audit-logs?${qs.toString()}`);
      if (!res.ok) {
        const errText =
          res.status === 403
            ? 'Accès refusé.'
            : res.status === 401
              ? 'Session requise.'
              : `Erreur ${res.status}`;
        statusEl.textContent = errText;
        return;
      }
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      total = typeof data.total === 'number' ? data.total : items.length;

      if (!append) {
        tableHost.replaceChildren();
      }

      if (!items.length && !append) {
        const emptyP = document.createElement('p');
        emptyP.className = 'dashboard-muted-lead';
        emptyP.textContent = 'Aucune entrée pour le moment.';
        tableHost.append(emptyP);
        loadMore.hidden = true;
        statusEl.textContent = '0 entrée.';
        return;
      }

      if (!append) {
        const table = document.createElement('table');
        table.className = 'audit-logs-api-table';
        const thead = document.createElement('thead');
        const thr = document.createElement('tr');
        const headerLabels = [
          'Date (UTC)',
          ...(isAdmin ? ['Tenant'] : []),
          'Ressource',
          'Id',
          'Action',
          'Utilisateur',
          'Métadonnées'
        ];
        for (const label of headerLabels) {
          const th = document.createElement('th');
          th.textContent = label;
          thr.append(th);
        }
        thead.append(thr);
        const tbody = document.createElement('tbody');
        items.forEach((row) => tbody.append(buildRow(row, isAdmin)));
        table.append(thead, tbody);
        tableHost.append(table);
      } else {
        const tbody = tableHost.querySelector('table.audit-logs-api-table tbody');
        items.forEach((row) => tbody?.append(buildRow(row, isAdmin)));
      }

      skip += items.length;
      statusEl.textContent = `${Math.min(skip, total)} / ${total} entrées affichées.`;
      loadMore.hidden = skip >= total || items.length < take;
    } catch {
      statusEl.textContent = 'Impossible de joindre l’API.';
    } finally {
      loading = false;
    }
  }

  loadMore.addEventListener('click', () => {
    void fetchPage(true);
  });

  if (isAdmin) {
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'btn btn-primary';
    apply.textContent = 'Appliquer filtre tenant';
    apply.addEventListener('click', () => {
      const inp = toolbar.querySelector('input.control-input');
      tenantFilter = inp instanceof HTMLInputElement ? inp.value.trim() : '';
      void fetchPage(false);
    });
    toolbar.append(apply);
  }

  toolbar.append(statusEl);
  card.append(head, toolbar, tableHost, loadMore);
  wrap.append(card);

  void fetchPage(false);

  return wrap;
}

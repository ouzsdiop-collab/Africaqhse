import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';

/**
 * Espace super-admin : cockpit entreprises & utilisateurs (SaaS).
 */
const MODULE_DEFS = [
  { key: 'risks', label: 'Risques' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'audits', label: 'Audits' },
  { key: 'actions', label: 'Actions' },
  { key: 'sites', label: 'Sites' },
  { key: 'ptw', label: 'Permis de travail' },
  { key: 'controlled_documents', label: 'Documents' },
  { key: 'imports', label: 'Imports' }
];

const ROLE_OPTIONS = [
  { value: 'CLIENT_ADMIN', label: 'Admin client' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'QHSE', label: 'QHSE' },
  { value: 'MANAGER', label: 'MANAGER' },
  { value: 'DIRECTION', label: 'DIRECTION' },
  { value: 'USER', label: 'USER' },
  { value: 'TERRAIN', label: 'TERRAIN' },
  { value: 'ASSISTANT', label: 'ASSISTANT' },
  { value: 'AUDITEUR', label: 'AUDITEUR' },
  { value: 'OPERATEUR', label: 'OPERATEUR' }
];

/** @param {string | null | undefined} role */
function roleBadgeLabel(role) {
  const r = String(role || '').toUpperCase();
  if (r === 'CLIENT_ADMIN') return 'ADMIN';
  return r || '—';
}

/** @param {string | null | undefined} role */
function roleBadgeClass(role) {
  const r = String(role || '').toUpperCase();
  if (r === 'SUPER_ADMIN') return 'sc-badge sc-badge--super';
  if (r === 'CLIENT_ADMIN' || r === 'ADMIN') return 'sc-badge sc-badge--admin';
  if (r === 'MANAGER') return 'sc-badge sc-badge--manager';
  if (r === 'USER' || r === 'TERRAIN' || r === 'OPERATEUR') return 'sc-badge sc-badge--user';
  return 'sc-badge sc-badge--default';
}

/** @param {string | null | undefined} d */
function formatActivity(d) {
  if (!d) return 'Jamais';
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

/** @param {unknown} settings */
function getModulesMap(settings) {
  const s = settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
  const m = s.modules && typeof s.modules === 'object' && !Array.isArray(s.modules) ? s.modules : {};
  return m;
}

/** @param {Record<string, unknown>} m @param {string} key */
function moduleEnabled(m, key) {
  return m[key] !== false;
}

/** @param {string} key */
function moduleLabelForKey(key) {
  const def = MODULE_DEFS.find((d) => d.key === key);
  return def ? def.label : key;
}

export function renderSaasClients() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas saas-clients-page';

  const su = getSessionUser();
  if (String(su?.role ?? '').toUpperCase() !== 'SUPER_ADMIN') {
    page.innerHTML = `
      <article class="content-card card-soft">
        <h3>Accès refusé</h3>
        <p class="content-card-lead">Cette page est réservée au super administrateur.</p>
      </article>`;
    return page;
  }

  page.innerHTML = `
    <style>
      .saas-clients-page .sc-cockpit-head { display:flex; flex-wrap:wrap; gap:16px; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
      .saas-clients-page .sc-tenant-card { margin-bottom:20px; border:1px solid var(--border-color, rgba(148,163,184,.25)); border-radius:12px; overflow:hidden; }
      .saas-clients-page .sc-tenant-card__head { display:flex; flex-wrap:wrap; gap:12px; justify-content:space-between; align-items:flex-start; padding:16px 18px; background:var(--surface-elevated, rgba(15,23,42,.35)); border-bottom:1px solid var(--border-color, rgba(148,163,184,.2)); }
      .saas-clients-page .sc-tenant-title { margin:0; font-size:1.05rem; font-weight:700; letter-spacing:-0.02em; }
      .saas-clients-page .sc-tenant-slug { font-size:12px; color:var(--text2, #94a3b8); margin-top:4px; }
      .saas-clients-page .sc-metrics { display:flex; flex-wrap:wrap; gap:12px 20px; font-size:12px; color:var(--text2, #94a3b8); padding:12px 18px; background:var(--surface1, rgba(30,41,59,.4)); }
      .saas-clients-page .sc-metrics strong { color:var(--text, #e2e8f0); font-weight:600; }
      .saas-clients-page .sc-modules { padding:14px 18px; border-bottom:1px solid var(--border-color, rgba(148,163,184,.15)); }
      .saas-clients-page .sc-modules__title { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--text3, #64748b); margin:0 0 10px; font-weight:700; }
      .saas-clients-page .sc-module-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:10px; }
      .saas-clients-page .sc-module-toggle { display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer; user-select:none; }
      .saas-clients-page .sc-module-toggle input { accent-color:var(--accent, #22d3ee); }
      .saas-clients-page .sc-users-wrap { padding:16px 18px; overflow-x:auto; }
      .saas-clients-page .sc-users-table { width:100%; border-collapse:collapse; font-size:13px; min-width:520px; }
      .saas-clients-page .sc-users-table th { text-align:left; padding:8px 10px 8px 0; color:var(--text3, #64748b); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid var(--border-color, rgba(148,163,184,.2)); }
      .saas-clients-page .sc-users-table td { padding:10px 10px 10px 0; border-bottom:1px solid var(--border-color, rgba(148,163,184,.12)); vertical-align:middle; }
      .saas-clients-page .sc-user-actions { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
      .saas-clients-page .sc-btn-ghost { padding:6px 10px; font-size:11px; border-radius:8px; border:1px solid var(--border-color, rgba(148,163,184,.35)); background:transparent; color:var(--text, #e2e8f0); cursor:pointer; }
      .saas-clients-page .sc-btn-ghost:hover { border-color:var(--accent, #22d3ee); color:var(--accent, #22d3ee); }
      .saas-clients-page .sc-btn-danger { border-color:rgba(248,113,113,.45); color:#fca5a5; }
      .saas-clients-page .sc-btn-danger:hover { border-color:#f87171; color:#fecaca; }
      .saas-clients-page .sc-role-select { max-width:140px; font-size:12px; padding:6px 8px; border-radius:8px; border:1px solid var(--border-color, rgba(148,163,184,.35)); background:var(--surface2, #1e293b); color:var(--text, #e2e8f0); }
      .saas-clients-page .sc-status-select { font-size:12px; padding:6px 10px; border-radius:8px; border:1px solid var(--border-color, rgba(148,163,184,.35)); background:var(--surface2, #1e293b); color:var(--text, #e2e8f0); }
      .saas-clients-page .sc-pill { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:600; }
      .saas-clients-page .sc-pill--active { background:rgba(34,197,94,.15); color:#86efac; }
      .saas-clients-page .sc-pill--trial { background:rgba(250,204,21,.12); color:#fde047; }
      .saas-clients-page .sc-pill--suspended { background:rgba(248,113,113,.15); color:#fca5a5; }
      .saas-clients-page .sc-badge { display:inline-flex; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
      .saas-clients-page .sc-badge--super { background:rgba(56,189,248,.2); color:#7dd3fc; }
      .saas-clients-page .sc-badge--admin { background:rgba(167,139,250,.2); color:#c4b5fd; }
      .saas-clients-page .sc-badge--manager { background:rgba(52,211,153,.18); color:#6ee7b7; }
      .saas-clients-page .sc-badge--user { background:rgba(148,163,184,.2); color:#cbd5e1; }
      .saas-clients-page .sc-badge--default { background:rgba(100,116,139,.2); color:#94a3b8; }
      .saas-clients-page .sc-add-user { padding:16px 18px; background:var(--surface1, rgba(30,41,59,.25)); border-top:1px solid var(--border-color, rgba(148,163,184,.12)); }
      .saas-clients-page .sc-add-user__grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:10px; align-items:end; }
      .saas-clients-page .sc-inactive { opacity:.55; text-decoration:line-through; text-decoration-color:rgba(248,113,113,.5); }
      @media (max-width:640px) {
        .saas-clients-page .sc-users-table { min-width:100%; }
        .saas-clients-page .sc-users-table th:nth-child(4),
        .saas-clients-page .sc-users-table td:nth-child(4) { display:none; }
      }
    </style>
    <article class="content-card card-soft">
      <div class="sc-cockpit-head">
        <div>
          <div class="section-kicker">SaaS</div>
          <h3 style="margin:0 0 6px">Cockpit clients</h3>
          <p class="content-card-lead" style="margin:0;max-width:64ch;font-size:13px">
            Par entreprise : utilisateurs, rôles, statut et modules activés. Le mot de passe provisoire n’est visible qu’une seule fois (jamais récupérable ensuite).
          </p>
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:8px;max-width:720px">
        <label class="field field-full">
          <span>Nom de l’entreprise</span>
          <input type="text" class="control-input sc-in-company" maxlength="200" autocomplete="organization" />
        </label>
        <label class="field field-full">
          <span>Nom du contact (admin client)</span>
          <input type="text" class="control-input sc-in-contact" maxlength="120" autocomplete="name" />
        </label>
        <label class="field field-full">
          <span>E-mail de connexion</span>
          <input type="email" class="control-input sc-in-email" maxlength="254" autocomplete="email" />
        </label>
        <label class="field field-full">
          <span>Identifiant client <span style="color:var(--text3)">(optionnel)</span></span>
          <input type="text" class="control-input sc-in-code" maxlength="40" autocomplete="off" placeholder="ex. acme-mali" />
        </label>
        <button type="button" class="btn btn-primary sc-btn-create field-full" style="min-height:48px;font-weight:700">
          Créer l’entreprise et l’admin client
        </button>
      </div>
      <div class="sc-list-host stack" style="margin-top:24px"></div>
    </article>
    <div class="sc-modal" hidden style="position:fixed;inset:0;background:rgba(15,23,42,.38);display:none;align-items:center;justify-content:center;z-index:10050;padding:16px" role="dialog" aria-modal="true" aria-labelledby="sc-modal-title" aria-hidden="true">
      <div class="content-card card-soft sc-modal-inner" style="max-width:480px;width:100%;position:relative">
        <button type="button" class="btn sc-modal-close" style="position:absolute;top:12px;right:12px">J'ai copié</button>
        <h3 id="sc-modal-title" style="margin-top:0">Mot de passe provisoire généré</h3>
        <p class="content-card-lead sc-modal-lead" style="font-size:13px"></p>
        <pre class="sc-modal-secret" style="font-size:14px;padding:12px;border-radius:8px;background:var(--surface-2,#f8fafc);border:1px solid rgba(15,23,42,.14);color:var(--color-text-primary,#0f172a);overflow:auto"></pre>
        <div style="display:flex;gap:10px;align-items:center;justify-content:space-between">
          <p style="font-size:12px;color:var(--text2);margin:0">Ce mot de passe ne sera plus visible après fermeture.</p>
          <button type="button" class="btn sc-modal-copy">Copier</button>
        </div>
      </div>
    </div>
  `;

  const companyIn = page.querySelector('.sc-in-company');
  const contactIn = page.querySelector('.sc-in-contact');
  const emailIn = page.querySelector('.sc-in-email');
  const codeIn = page.querySelector('.sc-in-code');
  const createBtn = page.querySelector('.sc-btn-create');
  const listHost = page.querySelector('.sc-list-host');
  const modal = page.querySelector('.sc-modal');
  const modalLead = page.querySelector('.sc-modal-lead');
  const modalSecret = page.querySelector('.sc-modal-secret');
  const modalClose = page.querySelector('.sc-modal-close');
  const modalInner = page.querySelector('.sc-modal-inner');
  const modalCopy = page.querySelector('.sc-modal-copy');

  /** @type {((e: KeyboardEvent) => void) | null} */
  let provisionalModalEscHandler = null;

  /** @type {(() => void) | null} */
  let provisionalModalAfterClose = null;

  function debugPasswordOneShot(action, data) {
    console.log('[saas-admin.password.one-shot]', {
      action,
      hasTemporaryPasswordOneTime: Boolean(data?.temporaryPasswordOneTime),
      email: data?.user?.email,
      invitationSent: data?.invitation?.sent
    });
  }

  /**
   * Affichage strict one-shot: uniquement si le backend retourne `temporaryPasswordOneTime`
   * dans la réponse immédiate POST (jamais stocké côté client).
   * @param {unknown} payload
   * @param {string} titleHtml
   * @param {string} extraHtml
   * @param {(() => void) | null} [afterClose]
   * @returns {boolean}
   */
  function showTemporaryPasswordOneShot(payload, titleHtml, extraHtml, afterClose = null) {
    const secret = typeof payload?.temporaryPasswordOneTime === 'string'
      ? payload.temporaryPasswordOneTime.trim()
      : '';
    if (!secret) return false;
    showOnceModal(titleHtml, secret, extraHtml, afterClose ? { afterClose } : null);
    return true;
  }

  function closeProvisionalModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    if (modalLead) modalLead.innerHTML = '';
    if (modalSecret) modalSecret.textContent = '';
    if (provisionalModalEscHandler) {
      document.removeEventListener('keydown', provisionalModalEscHandler);
      provisionalModalEscHandler = null;
    }
    const after = provisionalModalAfterClose;
    provisionalModalAfterClose = null;
    if (after) {
      try {
        after();
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * @param {string} titleHtml
   * @param {string} secret
   * @param {string} extraHtml
   * @param {{ afterClose?: () => void } | null} [opts]
   */
  function showOnceModal(titleHtml, secret, extraHtml, opts = null) {
    if (!modal || !modalLead || !modalSecret) return;
    provisionalModalAfterClose = opts && typeof opts.afterClose === 'function' ? opts.afterClose : null;
    modalSecret.textContent = secret;
    let lead = titleHtml;
    if (!String(secret || '').trim()) {
      lead += `<p style="font-size:13px;color:var(--warning,#f59e0b);margin-top:12px;font-weight:600">Aucun mot de passe reçu du serveur. Utilisez le bouton « Réinitialiser » sur la carte entreprise pour en générer un.</p>`;
    }
    modalLead.innerHTML =
      lead +
      (extraHtml
        ? `<p class="content-card-lead" style="font-size:13px;margin-top:10px">${extraHtml}</p>`
        : '');
    modal.hidden = false;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    if (provisionalModalEscHandler) {
      document.removeEventListener('keydown', provisionalModalEscHandler);
    }
    provisionalModalEscHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeProvisionalModal();
      }
    };
    document.addEventListener('keydown', provisionalModalEscHandler);
  }

  modalClose?.addEventListener('click', () => {
    closeProvisionalModal();
  });
  modalInner?.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  modal?.addEventListener('click', () => {
    closeProvisionalModal();
  });

  modalCopy?.addEventListener('click', async () => {
    const value = String(modalSecret?.textContent || '').trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast('Mot de passe copié.', 'success');
    } catch {
      showToast('Copie impossible.', 'error');
    }
  });

  async function refreshList() {
    if (!listHost) return;
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/admin/clients');
      if (res.status === 401 || res.status === 403) {
        listHost.innerHTML = `<p style="margin:0;font-size:13px">Accès refusé (${res.status}).</p>`;
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const clients = Array.isArray(data.clients) ? data.clients : [];
      if (!clients.length) {
        listHost.innerHTML =
          '<p style="margin:0;font-size:13px;color:var(--text2)">Aucune entreprise cliente pour le moment.</p>';
        return;
      }

      const frag = document.createDocumentFragment();

      for (const row of clients) {
        const t = row.tenant || {};
        const tid = String(t.id || '');
        const users = Array.isArray(row.users) ? row.users : [];
        const settings = t.settings;
        const modMap = getModulesMap(settings);

        let lastAct = null;
        for (const u of users) {
          if (u.lastLoginAt && (!lastAct || new Date(u.lastLoginAt) > new Date(lastAct))) {
            lastAct = u.lastLoginAt;
          }
        }

        const st = String(t.status || 'active').toLowerCase();
        const pillClass =
          st === 'suspended' ? 'sc-pill sc-pill--suspended' : st === 'trial' ? 'sc-pill sc-pill--trial' : 'sc-pill sc-pill--active';
        const pillLabel = st === 'suspended' ? 'Suspendu' : st === 'trial' ? 'Essai' : 'Actif';

        const card = document.createElement('article');
        card.className = 'content-card card-soft sc-tenant-card';
        card.innerHTML = `
          <div class="sc-tenant-card__head">
            <div>
              <h4 class="sc-tenant-title">${escapeHtml(t.name || '')}</h4>
              <div class="sc-tenant-slug"><code>${escapeHtml(t.slug || '')}</code> · <span class="${pillClass}">${pillLabel}</span></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
              <label style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:6px">
                Statut client
                <select class="sc-status-select sc-tenant-status" data-tenant="${escapeHtml(tid)}" aria-label="Statut entreprise">
                  <option value="active">Actif</option>
                  <option value="trial">Essai</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </label>
              <button type="button" class="btn sc-btn-ghost sc-btn-reset-admin" data-tenant="${escapeHtml(tid)}" title="Réinitialise le mot de passe de l’admin client principal">
                MDP admin principal
              </button>
              <button type="button" class="btn btn-primary sc-btn-open-client" data-tenant="${escapeHtml(tid)}">
                Ouvrir interface client
              </button>
            </div>
          </div>
          <div class="sc-metrics">
            <span><strong>${users.length}</strong> utilisateur(s)</span>
            <span>Dernière activité : <strong>${escapeHtml(formatActivity(lastAct))}</strong></span>
            <span>Mise à jour : <strong>${escapeHtml(formatActivity(t.updatedAt))}</strong></span>
          </div>
          <div class="sc-modules">
            <p class="sc-modules__title">Modules (référentiel)</p>
            <div class="sc-module-grid sc-module-host" data-tenant="${escapeHtml(tid)}"></div>
          </div>
          <div class="sc-users-wrap">
            <table class="sc-users-table">
              <thead><tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Activité</th>
                <th>État</th>
                <th>Actions</th>
              </tr></thead>
              <tbody class="sc-users-tbody"></tbody>
            </table>
          </div>
          <div class="sc-add-user">
            <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);font-weight:700">Nouvel utilisateur</p>
            <div class="sc-add-user__grid">
              <label class="field" style="margin:0">
                <span>Nom</span>
                <input type="text" class="control-input sc-nu-name" maxlength="120" autocomplete="name" />
              </label>
              <label class="field" style="margin:0">
                <span>E-mail</span>
                <input type="email" class="control-input sc-nu-email" maxlength="254" autocomplete="email" />
              </label>
              <label class="field" style="margin:0">
                <span>Rôle</span>
                <select class="control-input sc-nu-role">
                  ${ROLE_OPTIONS.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}
                </select>
              </label>
              <button type="button" class="btn btn-primary sc-nu-submit" data-tenant="${escapeHtml(tid)}" style="min-height:44px;font-weight:600">Créer l’utilisateur</button>
            </div>
          </div>
        `;

        const statusSel = card.querySelector('.sc-tenant-status');
        if (statusSel && st) {
          statusSel.value = st === 'trial' || st === 'suspended' ? st : 'active';
          statusSel.dataset.last = statusSel.value;
        }

        const modHost = card.querySelector('.sc-module-host');
        if (modHost) {
          for (const def of MODULE_DEFS) {
            const on = moduleEnabled(modMap, def.key);
            const lab = document.createElement('label');
            lab.className = 'sc-module-toggle';
            lab.innerHTML = `<input type="checkbox" class="sc-mod-cb" data-key="${escapeHtml(def.key)}" ${on ? 'checked' : ''} />
              <span>${escapeHtml(def.label)}</span>`;
            modHost.appendChild(lab);
          }
          modHost.querySelectorAll('.sc-mod-cb').forEach((inp) => {
            inp.addEventListener('change', async () => {
              const key = inp.getAttribute('data-key');
              if (!key || !tid) return;
              const enabled = inp.checked;
              if (
                !enabled &&
                !window.confirm(
                  `Désactiver le module « ${moduleLabelForKey(key)} » pour cette entreprise ? Les utilisateurs peuvent perdre l’accès à cette fonctionnalité.`
                )
              ) {
                inp.checked = true;
                return;
              }
              try {
                const r = await qhseFetch(`/api/admin/clients/${encodeURIComponent(tid)}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ modules: { [key]: enabled } })
                });
                const j = await r.json().catch(() => ({}));
            debugPasswordOneShot('create-tenant-user', j);
                if (!r.ok) {
                  showToast(typeof j.error === 'string' ? j.error : 'Échec enregistrement module', 'error');
                  inp.checked = !enabled;
                  return;
                }
                showToast('Module mis à jour.', 'success');
              } catch {
                showToast('Erreur réseau', 'error');
                inp.checked = !enabled;
              }
            });
          });
        }

        statusSel?.addEventListener('change', async () => {
          const sel = statusSel;
          const v = String(sel.value || 'active');
          const prev = String(sel.dataset.last || 'active');
          if (
            v !== prev &&
            !window.confirm(
              `Modifier le statut de l’entreprise (${prev} → ${v}) ? Cela peut suspendre l’accès client ou passer en essai selon le choix.`
            )
          ) {
            sel.value = prev;
            return;
          }
          try {
            const r = await qhseFetch(`/api/admin/clients/${encodeURIComponent(tid)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: v })
            });
            const j = await r.json().catch(() => ({}));
            debugPasswordOneShot('create-tenant-user', j);

            if (!r.ok) {
              showToast(typeof j.error === 'string' ? j.error : 'Échec', 'error');
              sel.value = prev;
              return;
            }
            sel.dataset.last = v;
            showToast('Statut entreprise mis à jour.', 'success');
            void refreshList();
          } catch {
            showToast('Erreur réseau', 'error');
            sel.value = prev;
          }
        });

        card.querySelector('.sc-btn-reset-admin')?.addEventListener('click', async () => {
          const btn = card.querySelector('.sc-btn-reset-admin');
          if (!btn || !tid) return;
          if (
            !window.confirm(
              `Réinitialiser l'accès de l’administrateur client principal ? Un e-mail d'accès sera renvoyé ; l’ancien accès ne fonctionnera plus.`
            )
          ) {
            return;
          }
          const prev = btn.textContent;
          btn.setAttribute('disabled', 'true');
          btn.textContent = '…';
          try {
            const r2 = await qhseFetch(`/api/admin/clients/${encodeURIComponent(tid)}/reset-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            const b2 = await r2.json().catch(() => ({}));
            debugPasswordOneShot('reset-client-admin-password', b2);
            
            if (!r2.ok) {
              showToast(typeof b2.error === 'string' ? b2.error : 'Échec', 'error');
              return;
            }
            const sent = b2?.invitation?.sent === true;
            const exp = b2?.invitation?.expiresAt ? new Date(b2.invitation.expiresAt).toLocaleString('fr-FR') : '—';
            const emailState = sent ? 'E-mail envoyé' : escapeHtml(String(b2?.invitation?.emailError || 'E-mail non envoyé'));
            if (showTemporaryPasswordOneShot(
              b2,
              '<strong>Mot de passe provisoire généré</strong>',
              `Copiez ce mot de passe maintenant. Il ne sera plus affiché ensuite.<br>Statut e-mail : ${emailState}<br>Expiration : ${escapeHtml(exp)}`,
              () => void refreshList()
            )) {
            } else {
              showToast('Accès réinitialisé, mais aucun mot de passe provisoire one-shot reçu.', 'warning');
            }
          } catch {
            showToast('Erreur réseau', 'error');
          } finally {
            btn.removeAttribute('disabled');
            btn.textContent = prev;
          }
        });
        card.querySelector('.sc-btn-open-client')?.addEventListener('click', async () => {
          const btn = card.querySelector('.sc-btn-open-client');
          if (!btn || !tid) return;
          btn.setAttribute('disabled', 'true');
          try {
            const r = await qhseFetch(`/api/admin/tenants/${encodeURIComponent(tid)}/setup/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            const j = await r.json().catch(() => ({}));
            
            if (!r.ok) {
              showToast(typeof j.error === 'string' ? j.error : 'Impossible d’ouvrir l’interface client', 'error');
              return;
            }
            window.location.assign('/app');
          } catch {
            showToast('Erreur réseau', 'error');
          } finally {
            btn.removeAttribute('disabled');
          }
        });

        const tb = card.querySelector('.sc-users-tbody');
        if (tb) {
          for (const u of users) {
            const tr = document.createElement('tr');
            const uid = String(u.id || '');
            const status = String(u.status || (u.isActive === false ? 'SUSPENDED' : 'ACTIVE')).toUpperCase();
            const active = status === 'ACTIVE' || status === 'INVITED';
            const rVal = String(u.role || '').toUpperCase();
            tr.className = active ? '' : 'sc-inactive-row';
            tr.innerHTML = `
              <td class="${active ? '' : 'sc-inactive'}">
                <div style="font-weight:600">${escapeHtml(u.name || '')}</div>
                <div style="font-size:11px;color:var(--text3)">${escapeHtml(u.email || '')}</div>
                ${u.clientCode ? `<div style="font-size:11px"><code>${escapeHtml(u.clientCode)}</code></div>` : ''}
              </td>
              <td><span class="${roleBadgeClass(u.role)}">${escapeHtml(roleBadgeLabel(u.role))}</span></td>
              <td style="font-size:12px;color:var(--text2)">${escapeHtml(formatActivity(u.lastLoginAt))}</td>
              <td>${status === 'ACTIVE' ? '<span class="sc-pill sc-pill--active">ACTIVE</span>' : `<span class="sc-pill sc-pill--suspended">${escapeHtml(status)}</span>`}</td>
              <td class="sc-user-actions">
                <select class="sc-role-select sc-role-ch" data-user="${escapeHtml(uid)}" data-tenant="${escapeHtml(tid)}" data-current="${escapeHtml(rVal)}">
                  ${ROLE_OPTIONS.map((o) => `<option value="${escapeHtml(o.value)}" ${o.value === rVal ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}
                </select>
                <button type="button" class="btn sc-btn-ghost sc-btn-apply-role" data-user="${escapeHtml(uid)}" data-tenant="${escapeHtml(tid)}">Rôle</button>
                <button type="button" class="btn sc-btn-ghost sc-btn-user-reset" data-user="${escapeHtml(uid)}" data-tenant="${escapeHtml(tid)}">Nouveau MDP</button>
                <button type="button" class="btn sc-btn-ghost ${active ? 'sc-btn-danger' : ''} sc-btn-toggle-active" data-user="${escapeHtml(uid)}" data-tenant="${escapeHtml(tid)}" data-active="${active ? '1' : '0'}">${active ? 'Suspendre' : 'Réactiver'}</button>
              </td>
            `;
            tb.appendChild(tr);
          }
        }

        card.querySelectorAll('.sc-btn-apply-role').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const uid = btn.getAttribute('data-user');
            const tenant = btn.getAttribute('data-tenant');
            const tr = btn.closest('tr');
            const sel = tr?.querySelector('.sc-role-ch');
            if (!uid || !tenant || !sel) return;
            const role = String(sel.value || '').toUpperCase();
            const cur = String(sel.getAttribute('data-current') || '');
            if (role === cur) {
              showToast('Rôle inchangé.', 'error');
              return;
            }
            if (
              !window.confirm(
                `Appliquer le rôle « ${role} » à cet utilisateur ? Les permissions dans cette organisation seront mises à jour immédiatement.`
              )
            ) {
              return;
            }
            btn.setAttribute('disabled', 'true');
            try {
              const r = await qhseFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tenant, role })
              });
              const j = await r.json().catch(() => ({}));
              if (!r.ok) {
                showToast(typeof j.error === 'string' ? j.error : 'Échec', 'error');
                return;
              }
              showToast('Rôle mis à jour.', 'success');
              void refreshList();
            } catch {
              showToast('Erreur réseau', 'error');
            } finally {
              btn.removeAttribute('disabled');
            }
          });
        });

        card.querySelectorAll('.sc-btn-user-reset').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const uid = btn.getAttribute('data-user');
            const tenant = btn.getAttribute('data-tenant');
            if (!uid || !tenant) return;
            if (
              !window.confirm(
                `Générer un nouveau mot de passe provisoire pour cet utilisateur ? L’ancien accès ne fonctionnera plus.`
              )
            ) {
              return;
            }
            btn.setAttribute('disabled', 'true');
            try {
              const r2 = await qhseFetch(`/api/admin/users/${encodeURIComponent(uid)}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tenant })
              });
              const b2 = await r2.json().catch(() => ({}));
              debugPasswordOneShot('reset-tenant-user-password', b2);
              
              if (!r2.ok) {
                showToast(typeof b2.error === 'string' ? b2.error : 'Échec', 'error');
                return;
              }
              const sent = b2?.invitation?.sent === true;
              const exp = b2?.invitation?.expiresAt ? new Date(b2.invitation.expiresAt).toLocaleString('fr-FR') : '—';
              const emailState = sent ? 'E-mail envoyé' : escapeHtml(String(b2?.invitation?.emailError || 'E-mail non envoyé'));
              if (showTemporaryPasswordOneShot(
                b2,
                '<strong>Mot de passe provisoire généré</strong>',
                `Copiez ce mot de passe maintenant. Il ne sera plus affiché ensuite.<br>Statut e-mail : ${emailState}<br>Expiration : ${escapeHtml(exp)}`,
                () => void refreshList()
              )) {
              } else {
                showToast('Accès réinitialisé, mais aucun mot de passe provisoire one-shot reçu.', 'warning');
              }
            } catch {
              showToast('Erreur réseau', 'error');
            } finally {
              btn.removeAttribute('disabled');
            }
          });
        });

        card.querySelectorAll('.sc-btn-toggle-active').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const uid = btn.getAttribute('data-user');
            const tenant = btn.getAttribute('data-tenant');
            const was = btn.getAttribute('data-active') === '1';
            if (!uid || !tenant) return;
            if (
              !window.confirm(
                was
                  ? 'Suspendre cet utilisateur ? Il ne pourra plus se connecter tant qu’il n’est pas réactivé.'
                  : 'Réactiver cet utilisateur ? Il pourra à nouveau se connecter.'
              )
            ) {
              return;
            }
            btn.setAttribute('disabled', 'true');
            try {
              const r = await qhseFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tenant, isActive: !was })
              });
              const j = await r.json().catch(() => ({}));
              if (!r.ok) {
                showToast(typeof j.error === 'string' ? j.error : 'Échec', 'error');
                return;
              }
              showToast(was ? 'Utilisateur suspendu.' : 'Utilisateur réactivé.', 'success');
              void refreshList();
            } catch {
              showToast('Erreur réseau', 'error');
            } finally {
              btn.removeAttribute('disabled');
            }
          });
        });

        card.querySelector('.sc-nu-submit')?.addEventListener('click', async () => {
          const btnNu = card.querySelector('.sc-nu-submit');
          const nName = card.querySelector('.sc-nu-name');
          const nEmail = card.querySelector('.sc-nu-email');
          const nRole = card.querySelector('.sc-nu-role');
          if (!btnNu || !nName || !nEmail || !nRole || !tid) return;
          const name = String(nName.value || '').trim();
          const email = String(nEmail.value || '').trim().toLowerCase();
          const role = String(nRole.value || 'USER').toUpperCase();
          if (!name || !email) {
            showToast('Nom et e-mail requis.', 'error');
            return;
          }
          btnNu.setAttribute('disabled', 'true');
          try {
            const r = await qhseFetch(`/api/admin/clients/${encodeURIComponent(tid)}/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, role })
            });
            const j = await r.json().catch(() => ({}));
            
            if (!r.ok) {
              showToast(typeof j.error === 'string' ? j.error : `Erreur ${r.status}`, 'error');
              return;
            }

            const sent = j?.invitation?.sent === true;
            const exp = j?.invitation?.expiresAt ? new Date(j.invitation.expiresAt).toLocaleString('fr-FR') : '—';
            const emailState = sent ? 'E-mail envoyé' : escapeHtml(String(j?.invitation?.emailError || 'E-mail non envoyé'));
            if (showTemporaryPasswordOneShot(
              j,
              '<strong>Mot de passe provisoire généré</strong>',
              `Copiez ce mot de passe maintenant. Il ne sera plus affiché ensuite.<br>${j.user ? `${escapeHtml(j.user.email || '')}` : ''}<br>Statut e-mail : ${emailState}<br>Expiration : ${escapeHtml(exp)}`,
              () => void refreshList()
            )) {
            } else {
              showToast('Utilisateur créé, mais aucun mot de passe provisoire one-shot reçu.', 'warning');
              void refreshList();
            }
            nName.value = '';
            nEmail.value = '';
            showToast(j?.invitation?.sent === false ? "Utilisateur créé. E-mail non envoyé : copiez le mot de passe provisoire." : "Utilisateur créé. E-mail d'accès envoyé.", j?.invitation?.sent === false ? 'warning' : 'success');
          } catch {
            showToast('Erreur réseau', 'error');
          } finally {
            btnNu.removeAttribute('disabled');
          }
        });

        frag.appendChild(card);
      }

      listHost.replaceChildren(frag);
    } catch {
      listHost.innerHTML =
        '<p style="margin:0;font-size:13px;color:var(--danger,#b91c1c)">Impossible de charger la liste.</p>';
    }
  }

  createBtn?.addEventListener('click', async () => {
    const companyName = String(companyIn?.value || '').trim();
    const contactName = String(contactIn?.value || '').trim();
    const email = String(emailIn?.value || '').trim().toLowerCase();
    const clientCodeRaw = String(codeIn?.value || '').trim().toLowerCase();
    if (!companyName || !contactName || !email) {
      showToast('Renseignez entreprise, contact et e-mail.', 'error');
      return;
    }
    /** @type {{ companyName: string, contactName: string, email: string, clientCode?: string }} */
    const body = { companyName, contactName, email };
    if (clientCodeRaw) {
      body.clientCode = clientCodeRaw;
    }
    const prev = createBtn.textContent;
    createBtn.disabled = true;
    createBtn.textContent = 'Création…';
    try {
      const res = await qhseFetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const j = await res.json().catch(() => ({}));
      debugPasswordOneShot('create-client-company-admin', j);
      
      if (!res.ok) {
        showToast(typeof j.error === 'string' ? j.error : `Erreur ${res.status}`, 'error');
        return;
      }
      const tenant = j.tenant || {};
      const user = j.user || {};
      const sent = j?.invitation?.sent === true;
      const exp = j?.invitation?.expiresAt ? new Date(j.invitation.expiresAt).toLocaleString('fr-FR') : '—';
      const emailState = sent ? 'E-mail envoyé' : escapeHtml(String(j?.invitation?.emailError || 'E-mail non envoyé'));
      if (showTemporaryPasswordOneShot(
        j,
        `<strong>Mot de passe provisoire généré</strong><br>Entreprise : ${escapeHtml(tenant.name || '')} (<code>${escapeHtml(tenant.slug || '')}</code>)`,
        `Admin principal : <code>${escapeHtml(user.email || '')}</code><br>Expiration : ${escapeHtml(exp)}<br>Statut e-mail : ${emailState}`,
        () => void refreshList()
      )) {
      } else {
        showToast('Entreprise créée, mais aucun mot de passe provisoire one-shot reçu.', 'warning');
        void refreshList();
      }
      companyIn.value = '';
      contactIn.value = '';
      emailIn.value = '';
      codeIn.value = '';
      showToast(j?.invitation?.sent === false ? "Entreprise créée. E-mail non envoyé : copiez le mot de passe provisoire." : "Entreprise cliente créée. E-mail d'accès envoyé.", j?.invitation?.sent === false ? 'warning' : 'success');
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = prev;
    }
  });

  void refreshList();
  return page;
}

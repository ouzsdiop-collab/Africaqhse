import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';

/**
 * Espace super-admin : création d'entreprises clientes et réinitialisation des mots de passe provisoires.
 */
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
      .sc-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(10, 18, 35, 0.72);
        backdrop-filter: blur(4px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 16px;
      }
      .sc-modal-overlay.is-open {
        display: flex;
      }
      .sc-modal-inner {
        max-width: 500px;
        width: 100%;
        background: var(--surface1, #fff);
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 24px 64px rgba(0,0,0,0.22);
        position: relative;
        animation: sc-modal-in 0.22s cubic-bezier(.4,0,.2,1);
      }
      @keyframes sc-modal-in {
        from { opacity: 0; transform: translateY(12px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .sc-modal-title {
        margin: 0 0 6px;
        font-size: 17px;
        font-weight: 700;
        color: var(--text1, #0f172a);
      }
      .sc-modal-lead {
        font-size: 13px;
        color: var(--text2, #475569);
        margin: 0 0 14px;
        line-height: 1.6;
      }
      .sc-modal-secret {
        font-family: 'Fira Mono', 'Courier New', monospace;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.04em;
        padding: 14px 16px;
        border-radius: 10px;
        background: #0f172a;
        color: #7dd3fc;
        border: 1px solid rgba(125,211,252,0.15);
        overflow: auto;
        word-break: break-all;
        white-space: pre-wrap;
        margin: 0 0 10px;
        user-select: all;
      }
      .sc-modal-hint {
        font-size: 11.5px;
        color: var(--text3, #94a3b8);
        margin: 0 0 20px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sc-modal-hint::before {
        content: '⚠';
        font-size: 13px;
        color: #f59e0b;
      }
      .sc-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .sc-btn-copy {
        padding: 9px 18px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        border: 1.5px solid var(--border, #e2e8f0);
        background: transparent;
        color: var(--text1, #0f172a);
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .sc-btn-copy:hover {
        background: var(--surface2, #f1f5f9);
      }
      .sc-btn-close-modal {
        padding: 9px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        border: none;
        background: var(--primary, #0d6e6e);
        color: #fff;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .sc-btn-close-modal:hover { opacity: 0.88; }
      .sc-status-badge {
        display: inline-block;
        padding: 2px 9px;
        border-radius: 99px;
        font-size: 11.5px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .sc-status-active  { background: #d1fae5; color: #065f46; }
      .sc-status-suspended { background: #fee2e2; color: #991b1b; }
      .sc-status-default { background: #e2e8f0; color: #475569; }
    </style>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">SaaS</div>
          <h3>Comptes clients</h3>
          <p class="content-card-lead" style="margin:0;max-width:62ch;font-size:13px">
            Créez une entreprise (tenant), un administrateur client et un mot de passe provisoire.
            Le mot de passe n'est affiché qu'une fois — communiquez-le par un canal sécurisé.
          </p>
        </div>
      </div>

      <div class="form-grid" style="gap:12px;margin-top:16px;max-width:640px">
        <label class="field field-full">
          <span>Nom de l'entreprise</span>
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
          <span>Identifiant client <span style="color:var(--text3)">(optionnel, minuscules et tirets)</span></span>
          <input type="text" class="control-input sc-in-code" maxlength="40" autocomplete="off" placeholder="ex. acme-mali" />
        </label>
        <button type="button" class="btn btn-primary sc-btn-create field-full" style="min-height:48px;font-weight:700">
          Créer le compte client
        </button>
      </div>

      <div class="sc-list-host stack" style="margin-top:24px"></div>
    </article>

    <!-- Modal mot de passe provisoire -->
    <div class="sc-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="sc-modal-title">
      <div class="sc-modal-inner">
        <p class="sc-modal-title" id="sc-modal-title">Mot de passe provisoire</p>
        <p class="sc-modal-lead sc-modal-lead-text"></p>
        <pre class="sc-modal-secret" title="Cliquez pour sélectionner tout"></pre>
        <p class="sc-modal-hint">Ce message ne sera plus affiché après fermeture.</p>
        <div class="sc-modal-actions">
          <button type="button" class="sc-btn-copy">Copier</button>
          <button type="button" class="sc-btn-close-modal">Fermer</button>
        </div>
      </div>
    </div>
  `;

  const companyIn  = page.querySelector('.sc-in-company');
  const contactIn  = page.querySelector('.sc-in-contact');
  const emailIn    = page.querySelector('.sc-in-email');
  const codeIn     = page.querySelector('.sc-in-code');
  const createBtn  = page.querySelector('.sc-btn-create');
  const listHost   = page.querySelector('.sc-list-host');
  const modal      = page.querySelector('.sc-modal-overlay');
  const modalLead  = page.querySelector('.sc-modal-lead-text');
  const modalSecret = page.querySelector('.sc-modal-secret');
  const modalClose = page.querySelector('.sc-btn-close-modal');
  const modalCopy  = page.querySelector('.sc-btn-copy');

  // ── Ouvrir la modal ──────────────────────────────────────────────
  function showOnceModal(leadHtml, secret, extraHtml) {
    if (!modal || !modalLead || !modalSecret) return;
    modalSecret.textContent = secret;
    modalLead.innerHTML =
      leadHtml +
      (extraHtml
        ? `<br><span style="font-size:12.5px;color:var(--text2)">${extraHtml}</span>`
        : '');
    modal.classList.add('is-open');
    modalClose?.focus();
  }

  // ── Fermer la modal ──────────────────────────────────────────────
  function closeModal() {
    modal?.classList.remove('is-open');
    if (modalLead)   modalLead.innerHTML = '';
    if (modalSecret) modalSecret.textContent = '';
  }

  modalClose?.addEventListener('click', closeModal);

  // Clic en dehors = fermeture
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Touche Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  // Bouton copier
  modalCopy?.addEventListener('click', async () => {
    const text = modalSecret?.textContent || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      modalCopy.textContent = 'Copié !';
      setTimeout(() => { if (modalCopy) modalCopy.textContent = 'Copier'; }, 2000);
    } catch {
      showToast('Impossible de copier automatiquement.', 'error');
    }
  });

  // ── Badge statut ─────────────────────────────────────────────────
  function statusBadge(status) {
    const s = String(status || '').toLowerCase();
    const cls = s === 'active' ? 'sc-status-active'
      : s === 'suspended' ? 'sc-status-suspended'
      : 'sc-status-default';
    return `<span class="sc-status-badge ${cls}">${escapeHtml(status || '—')}</span>`;
  }

  // ── Charger la liste ─────────────────────────────────────────────
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
          '<p style="margin:0;font-size:13px;color:var(--text2)">Aucun client pour le moment.</p>';
        return;
      }
      const table = document.createElement('table');
      table.className = 'data-table';
      table.style.cssText = 'width:100%;font-size:13px;margin-top:8px';
      table.innerHTML = `
        <thead><tr>
          <th>Entreprise</th><th>Slug</th><th>Statut</th><th>Admin</th><th>Identifiant</th><th></th>
        </tr></thead><tbody></tbody>`;
      const tb = table.querySelector('tbody');
      for (const row of clients) {
        const t = row.tenant || {};
        const u = row.clientAdmin;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600">${escapeHtml(t.name || '')}</td>
          <td><code>${escapeHtml(t.slug || '')}</code></td>
          <td>${statusBadge(t.status)}</td>
          <td>${u ? escapeHtml(u.email || '') : '—'}</td>
          <td>${u?.clientCode ? `<code>${escapeHtml(u.clientCode)}</code>` : '—'}</td>
          <td>
            <button type="button" class="btn sc-btn-reset" data-tenant="${escapeHtml(t.id || '')}"
              style="font-size:12px;padding:6px 12px;white-space:nowrap">
              Réinitialiser MDP
            </button>
          </td>
        `;
        tb?.appendChild(tr);
      }
      listHost.replaceChildren(table);

      listHost.querySelectorAll('.sc-btn-reset').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const tid = btn.getAttribute('data-tenant');
          if (!tid) return;
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
            if (!r2.ok) {
              showToast(typeof b2.error === 'string' ? b2.error : 'Échec', 'error');
              return;
            }
            const pwd = typeof b2.provisionalPassword === 'string' ? b2.provisionalPassword : '';
            showOnceModal(
              '<strong>Nouveau mot de passe provisoire</strong> — à communiquer au client une seule fois.',
              pwd,
              b2.user
                ? `Compte : <strong>${escapeHtml(b2.user.email || '')}</strong> · code <code>${escapeHtml(b2.user.clientCode || '')}</code>`
                : ''
            );
            showToast('Mot de passe réinitialisé.', 'success');
          } catch {
            showToast('Erreur réseau', 'error');
          } finally {
            btn.removeAttribute('disabled');
            btn.textContent = prev;
          }
        });
      });
    } catch {
      listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--danger,#b91c1c)">Impossible de charger la liste.</p>';
    }
  }

  // ── Créer un client ──────────────────────────────────────────────
  createBtn?.addEventListener('click', async () => {
    const companyName   = String(companyIn?.value  || '').trim();
    const contactName   = String(contactIn?.value  || '').trim();
    const email         = String(emailIn?.value    || '').trim().toLowerCase();
    const clientCodeRaw = String(codeIn?.value     || '').trim().toLowerCase();

    if (!companyName || !contactName || !email) {
      showToast('Renseignez entreprise, contact et e-mail.', 'error');
      return;
    }

    const body = { companyName, contactName, email };
    if (clientCodeRaw) body.clientCode = clientCodeRaw;

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
      if (!res.ok) {
        showToast(typeof j.error === 'string' ? j.error : `Erreur ${res.status}`, 'error');
        return;
      }
      const pwd    = typeof j.provisionalPassword === 'string' ? j.provisionalPassword : '';
      const tenant = j.tenant || {};
      const user   = j.user   || {};
      showOnceModal(
        `<strong>Compte créé.</strong> Entreprise : ${escapeHtml(tenant.name || '')} (<code>${escapeHtml(tenant.slug || '')}</code>)`,
        pwd,
        `Connexion : e-mail <code>${escapeHtml(user.email || '')}</code> ou identifiant <strong>${escapeHtml(user.clientCode || '')}</strong>`
      );
      companyIn.value = '';
      contactIn.value = '';
      emailIn.value   = '';
      codeIn.value    = '';
      showToast('Client créé.', 'success');
      void refreshList();
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
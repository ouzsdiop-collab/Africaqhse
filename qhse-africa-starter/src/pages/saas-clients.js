import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';

/**
 * Espace super-admin : création d’entreprises clientes et réinitialisation des mots de passe provisoires.
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
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">SaaS</div>
          <h3>Comptes clients</h3>
          <p class="content-card-lead" style="margin:0;max-width:62ch;font-size:13px">
            Créez une entreprise (tenant), un administrateur client et un mot de passe provisoire.
            Le mot de passe n’est affiché qu’une fois — communiquez-le par un canal sécurisé.
          </p>
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:16px;max-width:640px">
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
          <span>Identifiant client <span style="color:var(--text3)">(optionnel, minuscules et tirets)</span></span>
          <input type="text" class="control-input sc-in-code" maxlength="40" autocomplete="off" placeholder="ex. acme-mali" />
        </label>
        <button type="button" class="btn btn-primary sc-btn-create field-full" style="min-height:48px;font-weight:700">
          Créer le compte client
        </button>
      </div>
      <div class="sc-list-host stack" style="margin-top:24px"></div>
    </article>
    <div class="sc-modal" hidden style="position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px">
      <div class="content-card card-soft sc-modal-inner" style="max-width:480px;width:100%;position:relative">
        <button type="button" class="btn sc-modal-close" style="position:absolute;top:12px;right:12px">Fermer</button>
        <h3 style="margin-top:0">Mot de passe provisoire</h3>
        <p class="content-card-lead sc-modal-lead" style="font-size:13px"></p>
        <pre class="sc-modal-secret" style="font-size:14px;padding:12px;border-radius:8px;background:var(--surface2,#1e293b);overflow:auto"></pre>
        <p style="font-size:12px;color:var(--text2)">Ce message ne sera plus affiché après fermeture.</p>
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

  function showOnceModal(titleHtml, secret, extraHtml) {
    if (!modal || !modalLead || !modalSecret) return;
    modalSecret.textContent = secret;
    modalLead.innerHTML =
      titleHtml +
      (extraHtml
        ? `<p class="content-card-lead" style="font-size:13px;margin-top:10px">${extraHtml}</p>`
        : '');
    modal.hidden = false;
  }

  modalClose?.addEventListener('click', () => {
    if (modal) modal.hidden = true;
    if (modalLead) modalLead.innerHTML = '';
    if (modalSecret) modalSecret.textContent = '';
  });
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modalClose?.click();
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
          '<p style="margin:0;font-size:13px;color:var(--text2)">Aucun client pour le moment.</p>';
        return;
      }
      const table = document.createElement('table');
      table.className = 'data-table';
      table.style.width = '100%';
      table.style.fontSize = '13px';
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
          <td>${escapeHtml(t.name || '')}</td>
          <td><code>${escapeHtml(t.slug || '')}</code></td>
          <td>${escapeHtml(t.status || '')}</td>
          <td>${u ? escapeHtml(u.email || '') : '—'}</td>
          <td>${u?.clientCode ? `<code>${escapeHtml(u.clientCode)}</code>` : '—'}</td>
          <td><button type="button" class="btn sc-btn-reset" data-tenant="${escapeHtml(t.id || '')}">Réinitialiser MDP</button></td>
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
      if (!res.ok) {
        showToast(typeof j.error === 'string' ? j.error : `Erreur ${res.status}`, 'error');
        return;
      }
      const pwd = typeof j.provisionalPassword === 'string' ? j.provisionalPassword : '';
      const tenant = j.tenant || {};
      const user = j.user || {};
      showOnceModal(
        `<strong>Compte créé.</strong> Entreprise : ${escapeHtml(tenant.name || '')} (<code>${escapeHtml(tenant.slug || '')}</code>)`,
        pwd,
        `Connexion : e-mail <code>${escapeHtml(user.email || '')}</code> ou identifiant <strong>${escapeHtml(user.clientCode || '')}</strong>`
      );
      companyIn.value = '';
      contactIn.value = '';
      emailIn.value = '';
      codeIn.value = '';
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

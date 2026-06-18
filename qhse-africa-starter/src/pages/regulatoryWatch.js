import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../utils/designSystem.js';

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
}

export function renderRegulatoryWatch() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas regulatory-watch-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'regulatoryWatch', 'read');
  const canWrite = canResource(su?.role, 'regulatoryWatch', 'write');

  page.innerHTML = `
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Conformité réglementaire</div>
          <h3>Veille réglementaire</h3>
          <p class="content-card-lead" style="margin:0;max-width:64ch;font-size:13px">
            Registre des textes légaux/normatifs suivis pour votre pays. Curation manuelle ;
            l'assistance IA propose un résumé, jamais enregistré sans relecture et validation.
          </p>
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:8px;max-width:260px">
        <label class="field">
          <span>Filtrer par pays (code 2 lettres)</span>
          <input type="text" class="control-input rw-in-filter-country" maxlength="2" placeholder="ex. CI" />
        </label>
      </div>
      <div class="rw-list-host stack" style="margin-top:12px"></div>
    </article>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Nouveau</div>
          <h3>Ajouter un texte réglementaire</h3>
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:8px">
        <label class="field field-full">
          <span>Titre <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input rw-in-title" maxlength="300" />
        </label>
        <label class="field">
          <span>Pays <span style="color:var(--text3)">(code 2 lettres, obligatoire)</span></span>
          <input type="text" class="control-input rw-in-country" maxlength="2" placeholder="ex. CI" />
        </label>
        <label class="field">
          <span>Catégorie</span>
          <input type="text" class="control-input rw-in-category" maxlength="200" placeholder="ex. Sécurité incendie" />
        </label>
        <label class="field">
          <span>URL officielle</span>
          <input type="url" class="control-input rw-in-url" maxlength="2000" />
        </label>
        <label class="field">
          <span>Date d'entrée en vigueur</span>
          <input type="date" class="control-input rw-in-effective" />
        </label>
        <label class="field field-full">
          <span>Texte source (collé)</span>
          <textarea class="control-input rw-in-source" rows="5" maxlength="200000"></textarea>
        </label>
        <div class="field-full" style="display:flex;gap:8px;align-items:center">
          <button type="button" class="btn btn-secondary rw-btn-summarize">Résumer avec l'IA</button>
          <span class="rw-summarize-hint" style="font-size:12px;color:var(--text3)">Le résultat reste à relire avant sauvegarde.</span>
        </div>
        <label class="field field-full">
          <span>Résumé</span>
          <textarea class="control-input rw-in-summary" rows="3" maxlength="20000"></textarea>
        </label>
        <label class="field field-full">
          <span>Obligations clés (une par ligne)</span>
          <textarea class="control-input rw-in-obligations" rows="3" maxlength="20000"></textarea>
        </label>
        <button type="button" class="btn btn-primary rw-btn-create field-full" style="min-height:48px;font-weight:700">
          Ajouter le texte
        </button>
      </div>
    </article>
  `;

  const listHost = page.querySelector('.rw-list-host');
  const filterCountryIn = page.querySelector('.rw-in-filter-country');
  const titleIn = page.querySelector('.rw-in-title');
  const countryIn = page.querySelector('.rw-in-country');
  const categoryIn = page.querySelector('.rw-in-category');
  const urlIn = page.querySelector('.rw-in-url');
  const effectiveIn = page.querySelector('.rw-in-effective');
  const sourceIn = page.querySelector('.rw-in-source');
  const summaryIn = page.querySelector('.rw-in-summary');
  const obligationsIn = page.querySelector('.rw-in-obligations');
  const summarizeBtn = page.querySelector('.rw-btn-summarize');
  const createBtn = page.querySelector('.rw-btn-create');

  if (!canRead && su) {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture de la veille réglementaire non autorisée pour ce rôle.</p>';
    page.querySelectorAll('.form-grid input, .form-grid textarea, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
    return page;
  }

  if (!canWrite && su) {
    page.querySelectorAll('article:nth-of-type(2) input, article:nth-of-type(2) textarea, article:nth-of-type(2) button').forEach((el) => {
      el.disabled = true;
    });
  }

  function parseObligationsInput(raw) {
    return String(raw || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const country = filterCountryIn.value.trim();
      const qs = country ? `?country=${encodeURIComponent(country)}` : '';
      const res = await qhseFetch(`/api/regulatory-watch${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        listHost.replaceChildren();
        listHost.append(
          createEmptyState(
            '\u{1F4DC}',
            'Aucun texte réglementaire',
            'Ajoutez le premier texte suivi pour votre pays ci-dessous.'
          )
        );
        return;
      }
      listHost.replaceChildren();
      rows.forEach((e) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '8px';
        row.style.padding = '12px';
        row.style.border = '1px solid var(--border1, #334155)';
        row.style.borderRadius = '10px';

        const head = document.createElement('div');
        head.style.display = 'flex';
        head.style.justifyContent = 'space-between';
        head.style.alignItems = 'flex-start';
        head.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = e.officialUrl ? '' : e.title;
        if (e.officialUrl) {
          const a = document.createElement('a');
          a.href = e.officialUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = e.title;
          title.append(a);
        }
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [e.country];
        if (e.category) parts.push(e.category);
        if (e.effectiveDate) parts.push(`En vigueur : ${fmtDate(e.effectiveDate)}`);
        sub.textContent = parts.join(' · ');
        left.append(title, sub);
        head.append(left);
        row.append(head);

        if (e.summary) {
          const summary = document.createElement('p');
          summary.style.margin = '0';
          summary.style.fontSize = '13px';
          summary.textContent = e.summary;
          row.append(summary);
        }

        const obligations = Array.isArray(e.keyObligationsJson) ? e.keyObligationsJson : [];
        if (obligations.length > 0) {
          const list = document.createElement('ul');
          list.style.margin = '0';
          list.style.paddingLeft = '18px';
          list.style.fontSize = '12px';
          list.style.color = 'var(--text2)';
          obligations.forEach((o) => {
            const li = document.createElement('li');
            li.textContent = o;
            list.append(li);
          });
          row.append(list);
        }

        if (canWrite) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.style.alignSelf = 'flex-end';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer ce texte réglementaire ?')) return;
            try {
              const r = await qhseFetch(`/api/regulatory-watch/${encodeURIComponent(e.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Texte supprimé', 'info');
              await refreshList();
            } catch {
              showToast('Suppression impossible', 'error');
            }
          });
          row.append(delBtn);
        }

        listHost.append(row);
      });
    } catch {
      listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Liste indisponible : vérifiez l’API.</p>';
    }
  }

  filterCountryIn.addEventListener('change', () => refreshList());

  summarizeBtn.addEventListener('click', async () => {
    const sourceText = sourceIn.value.trim();
    if (!sourceText) {
      showToast('Collez d’abord le texte source', 'error');
      return;
    }
    summarizeBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/regulatory-watch/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Résumé impossible', 'error');
        return;
      }
      summaryIn.value = body.summary || '';
      obligationsIn.value = Array.isArray(body.keyObligations) ? body.keyObligations.join('\n') : '';
      showToast('Suggestion IA générée — relisez avant d’enregistrer', 'info');
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      summarizeBtn.disabled = false;
    }
  });

  createBtn.addEventListener('click', async () => {
    if (!canWrite && su) {
      showToast('Création réservée', 'warning');
      return;
    }
    const title = titleIn.value.trim();
    const country = countryIn.value.trim().toUpperCase();
    if (!title || country.length !== 2) {
      showToast('Titre et pays (2 lettres) requis', 'error');
      return;
    }
    const category = categoryIn.value.trim() || undefined;
    const officialUrl = urlIn.value.trim() || undefined;
    const effectiveDate = effectiveIn.value ? new Date(effectiveIn.value).toISOString() : undefined;
    const sourceText = sourceIn.value.trim() || undefined;
    const summary = summaryIn.value.trim() || undefined;
    const keyObligations = parseObligationsInput(obligationsIn.value);
    createBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/regulatory-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          country,
          category,
          officialUrl,
          effectiveDate,
          sourceText,
          summary,
          keyObligations
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Texte réglementaire ajouté', 'info');
      titleIn.value = '';
      countryIn.value = '';
      categoryIn.value = '';
      urlIn.value = '';
      effectiveIn.value = '';
      sourceIn.value = '';
      summaryIn.value = '';
      obligationsIn.value = '';
      await refreshList();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });

  refreshList();
  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'regulatory-watch-page-anchor';
  return page;
}

import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState } from '../utils/designSystem.js';
import { createQhseKpiStrip } from '../components/qhseKpiStrip.js';
import { fetchSitesCatalog } from '../services/sitesCatalog.service.js';
import { createLinkedActionFromPreventionPlan } from '../utils/preventionPlanActions.js';

const STATUS_OPTIONS = [
  ['all', 'Tous les statuts'],
  ['draft', 'Brouillon'],
  ['validated', 'Validé'],
  ['closed', 'Clôturé']
];

const EXPIRY_SOON_DAYS = 7;

function isExpiringSoon(p) {
  if (p.status === 'closed' || !p.endDate) return false;
  const d = new Date(p.endDate);
  if (Number.isNaN(d.getTime())) return false;
  const days = (d.getTime() - Date.now()) / 86400000;
  return days <= EXPIRY_SOON_DAYS;
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
}

function setupSignatureCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { clear: () => {}, dataUrl: () => '' };
  let drawing = false;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#14b8a6';

  const pos = (ev) => {
    const r = canvas.getBoundingClientRect();
    const p = ev.touches?.[0] || ev;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };
  const start = (ev) => {
    drawing = true;
    const p = pos(ev);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (ev) => {
    if (!drawing) return;
    const p = pos(ev);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const end = () => {
    drawing = false;
  };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseleave', end);
  canvas.addEventListener('touchstart', start, { passive: true });
  canvas.addEventListener('touchmove', move, { passive: true });
  canvas.addEventListener('touchend', end);

  return {
    clear: () => ctx.clearRect(0, 0, canvas.width, canvas.height),
    dataUrl: () => canvas.toDataURL('image/png')
  };
}

function ptwOptionLabel(permit) {
  const ref = permit?.ref || permit?.id || 'PTW';
  const parts = [ref, permit?.type, permit?.zone].filter(Boolean);
  return parts.join(' — ');
}

async function fetchPtwCatalog() {
  try {
    const res = await qhseFetch('/api/ptw');
    if (!res.ok) return [];
    const rows = await res.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function statusLabel(s) {
  if (s === 'validated') return 'Validé (2 signatures)';
  if (s === 'closed') return 'Clôturé';
  return 'Brouillon';
}

export function renderPreventionPlans() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas prevention-plans-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'preventionPlans', 'read');
  const canWrite = canResource(su?.role, 'preventionPlans', 'write');

  page.innerHTML = `
    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Coactivité</div>
          <h3>Plans de prévention</h3>
          <p class="content-card-lead" style="margin:0;max-width:64ch;font-size:13px">
            Inspection commune préalable, risques d'interférence et signatures des deux parties
            (client et entreprise extérieure) avant intervention sur site.
          </p>
        </div>
      </div>
      <div class="pp-kpi-host" style="margin-top:12px"></div>
      <div class="pp-expiry-banner-host"></div>
      <div class="pp-filter-toolbar" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px">
        <label class="field" style="min-width:200px">
          <span>Site</span>
          <select class="control-input pp-filter-site">
            <option value="">Tous les sites</option>
          </select>
        </label>
        <label class="field" style="min-width:180px">
          <span>Statut</span>
          <select class="control-input pp-filter-status"></select>
        </label>
      </div>
      <div class="pp-list-host stack" style="margin-top:12px"></div>
    </article>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Nouveau</div>
          <h3>Créer un plan de prévention</h3>
        </div>
      </div>
      <div class="form-grid" style="gap:12px;margin-top:8px">
        <label class="field field-full">
          <span>Entreprise extérieure <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input pp-in-company" maxlength="200" />
        </label>
        <label class="field">
          <span>Contact</span>
          <input type="text" class="control-input pp-in-contact" maxlength="200" />
        </label>
        <label class="field">
          <span>Date d'inspection commune</span>
          <input type="datetime-local" class="control-input pp-in-inspection" />
        </label>
        <label class="field">
          <span>Site</span>
          <select class="control-input pp-in-site">
            <option value="">Aucun site</option>
          </select>
        </label>
        <label class="field">
          <span>Permis de travail (PTW) lié</span>
          <select class="control-input pp-in-permit">
            <option value="">Aucun permis</option>
          </select>
        </label>
        <label class="field field-full">
          <span>Description de l'intervention</span>
          <textarea class="control-input pp-in-description" rows="2" maxlength="2000"></textarea>
        </label>
        <label class="field">
          <span>Début</span>
          <input type="datetime-local" class="control-input pp-in-start" />
        </label>
        <label class="field">
          <span>Fin</span>
          <input type="datetime-local" class="control-input pp-in-end" />
        </label>
        <label class="field field-full">
          <span>Risques d'interférence identifiés (un par ligne, séparer mesure par " :: ")</span>
          <textarea class="control-input pp-in-risks" rows="3" maxlength="4000" placeholder="Travail en hauteur croisé avec circulation engins :: Balisage et créneaux horaires distincts"></textarea>
        </label>
        <button type="button" class="btn btn-primary pp-btn-create field-full" style="min-height:48px;font-weight:700">
          Créer le plan de prévention
        </button>
      </div>
    </article>
  `;

  const kpiHost = page.querySelector('.pp-kpi-host');
  const expiryBannerHost = page.querySelector('.pp-expiry-banner-host');
  const siteFilterSel = page.querySelector('.pp-filter-site');
  const statusFilterSel = page.querySelector('.pp-filter-status');
  STATUS_OPTIONS.forEach(([value, label]) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    statusFilterSel.append(o);
  });
  let sitesCatalog = [];
  const siteIn = page.querySelector('.pp-in-site');
  fetchSitesCatalog()
    .then((sites) => {
      sitesCatalog = Array.isArray(sites) ? sites : [];
      sitesCatalog.forEach((s) => {
        const o1 = document.createElement('option');
        o1.value = s.id;
        o1.textContent = s.name;
        siteFilterSel.append(o1);
        const o2 = document.createElement('option');
        o2.value = s.id;
        o2.textContent = s.name;
        siteIn.append(o2);
      });
    })
    .catch(() => {});

  let ptwCatalog = [];
  const permitIn = page.querySelector('.pp-in-permit');
  fetchPtwCatalog().then((rows) => {
    ptwCatalog = rows;
    ptwCatalog.forEach((permit) => {
      const o = document.createElement('option');
      o.value = permit.id;
      o.textContent = ptwOptionLabel(permit);
      permitIn.append(o);
    });
  });

  const listHost = page.querySelector('.pp-list-host');
  const companyIn = page.querySelector('.pp-in-company');
  const contactIn = page.querySelector('.pp-in-contact');
  const inspectionIn = page.querySelector('.pp-in-inspection');
  const descriptionIn = page.querySelector('.pp-in-description');
  const startIn = page.querySelector('.pp-in-start');
  const endIn = page.querySelector('.pp-in-end');
  const risksIn = page.querySelector('.pp-in-risks');
  const createBtn = page.querySelector('.pp-btn-create');

  if (!canRead && su) {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture des plans de prévention non autorisée pour ce rôle.</p>';
    page.querySelectorAll('.form-grid input, .form-grid textarea, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
    return page;
  }

  if (!canWrite && su) {
    page.querySelectorAll('.form-grid input, .form-grid textarea, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
  }

  function parseRisksInput(raw) {
    return String(raw || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [description, measure] = line.split('::').map((p) => p.trim());
        return measure ? { description, measure } : { description };
      });
  }

  function renderSignaturePanel(plan, party, partyLabel, refreshList) {
    const wrap = document.createElement('div');
    wrap.style.marginTop = '8px';
    const existing = party === 'client' ? plan.clientSignature : plan.contractorSignature;
    if (existing) {
      const p = document.createElement('p');
      p.style.margin = '0';
      p.style.fontSize = '12px';
      p.style.color = 'var(--text2)';
      p.textContent = `${partyLabel} signé par ${existing.name} le ${fmtDate(existing.signedAt)}`;
      wrap.append(p);
      return wrap;
    }
    if (!canWrite) return wrap;
    const nameIn = document.createElement('input');
    nameIn.type = 'text';
    nameIn.className = 'control-input';
    nameIn.placeholder = `Nom du signataire (${partyLabel})`;
    nameIn.style.marginBottom = '6px';
    const cv = document.createElement('canvas');
    cv.width = 400;
    cv.height = 90;
    cv.style.border = '1px solid var(--border1, #334155)';
    cv.style.borderRadius = '8px';
    cv.style.background = '#fff';
    cv.style.touchAction = 'none';
    cv.style.display = 'block';
    cv.style.marginBottom = '6px';
    const tools = setupSignatureCanvas(cv);
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn btn-ghost';
    clearBtn.textContent = 'Effacer';
    clearBtn.addEventListener('click', () => tools.clear());
    const signBtn = document.createElement('button');
    signBtn.type = 'button';
    signBtn.className = 'btn btn-secondary';
    signBtn.textContent = `Signer (${partyLabel})`;
    signBtn.addEventListener('click', async () => {
      const name = nameIn.value.trim();
      if (!name) {
        showToast('Nom du signataire requis', 'error');
        return;
      }
      try {
        const r = await qhseFetch(`/api/prevention-plans/${encodeURIComponent(plan.id)}/sign/${party}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, signatureDataUrl: tools.dataUrl() })
        });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          showToast(typeof body.error === 'string' ? body.error : 'Signature impossible', 'error');
          return;
        }
        showToast('Signature enregistrée', 'info');
        await refreshList();
      } catch {
        showToast('Erreur serveur', 'error');
      }
    });
    btnRow.append(clearBtn, signBtn);
    wrap.append(nameIn, cv, btnRow);
    return wrap;
  }

  function renderKpis(rows) {
    const n = rows.length;
    const draft = rows.filter((p) => p.status === 'draft').length;
    const validated = rows.filter((p) => p.status === 'validated').length;
    const closed = rows.filter((p) => p.status === 'closed').length;
    const expiring = rows.filter(isExpiringSoon).length;
    kpiHost.replaceChildren(
      createQhseKpiStrip([
        { label: 'Plans affichés', value: n, tone: 'blue', hintTitle: 'Sur le périmètre filtré' },
        { label: 'Brouillons', value: draft, tone: 'amber', hintTitle: 'En attente de signatures' },
        { label: 'Validés', value: validated, tone: 'green', hintTitle: 'Signés par les deux parties' },
        { label: 'Clôturés', value: closed, tone: 'blue', hintTitle: 'Intervention terminée' },
        {
          label: 'Échéance proche',
          value: expiring,
          tone: 'red',
          hintTitle: `Fin d'intervention dans ≤ ${EXPIRY_SOON_DAYS} j ou dépassée, hors plans clôturés`
        }
      ])
    );
  }

  function renderExpiryBanner(rows) {
    const expiring = rows.filter(isExpiringSoon);
    if (expiring.length === 0) {
      expiryBannerHost.replaceChildren();
      return;
    }
    const banner = document.createElement('div');
    banner.style.display = 'flex';
    banner.style.flexDirection = 'column';
    banner.style.gap = '4px';
    banner.style.marginTop = '12px';
    banner.style.padding = '10px 14px';
    banner.style.borderRadius = '10px';
    banner.style.border = '1px solid #dc2626';
    banner.style.background = 'rgba(220,38,38,0.1)';
    const title = document.createElement('strong');
    title.style.fontSize = '13px';
    title.style.color = '#dc2626';
    title.textContent = `⚠ ${expiring.length} plan${expiring.length > 1 ? 's' : ''} de prévention à échéance proche ou dépassée`;
    banner.append(title);
    const list = document.createElement('span');
    list.style.fontSize = '12px';
    list.style.color = 'var(--text2)';
    list.textContent = expiring
      .map((p) => `${p.ref} — ${p.externalCompanyName} (fin ${fmtDate(p.endDate)})`)
      .join(' · ');
    banner.append(list);
    expiryBannerHost.replaceChildren(banner);
  }

  function renderEditForm(p, onDone) {
    const wrap = document.createElement('div');
    wrap.className = 'form-grid';
    wrap.style.gap = '10px';
    wrap.style.marginTop = '8px';
    wrap.style.padding = '10px';
    wrap.style.border = '1px dashed var(--border1, #334155)';
    wrap.style.borderRadius = '10px';

    const mk = (labelText, type, value, full) => {
      const label = document.createElement('label');
      label.className = full ? 'field field-full' : 'field';
      const span = document.createElement('span');
      span.textContent = labelText;
      const input = type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (type !== 'textarea') input.type = type;
      input.className = 'control-input';
      if (value != null) input.value = value;
      label.append(span, input);
      wrap.append(label);
      return input;
    };

    const companyEdit = mk('Entreprise extérieure', 'text', p.externalCompanyName, true);
    const contactEdit = mk('Contact', 'text', p.externalContact || '');
    const siteEdit = document.createElement('label');
    siteEdit.className = 'field';
    const siteSpan = document.createElement('span');
    siteSpan.textContent = 'Site';
    const siteSelect = document.createElement('select');
    siteSelect.className = 'control-input';
    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = 'Aucun site';
    siteSelect.append(noneOpt);
    sitesCatalog.forEach((s) => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.name;
      if (p.siteId === s.id) o.selected = true;
      siteSelect.append(o);
    });
    siteEdit.append(siteSpan, siteSelect);
    wrap.append(siteEdit);
    const permitEdit = document.createElement('label');
    permitEdit.className = 'field';
    const permitSpan = document.createElement('span');
    permitSpan.textContent = 'Permis de travail (PTW) lié';
    const permitSelect = document.createElement('select');
    permitSelect.className = 'control-input';
    const noPermitOpt = document.createElement('option');
    noPermitOpt.value = '';
    noPermitOpt.textContent = 'Aucun permis';
    permitSelect.append(noPermitOpt);
    ptwCatalog.forEach((permit) => {
      const o = document.createElement('option');
      o.value = permit.id;
      o.textContent = ptwOptionLabel(permit);
      if (p.permitId === permit.id) o.selected = true;
      permitSelect.append(o);
    });
    permitEdit.append(permitSpan, permitSelect);
    wrap.append(permitEdit);
    const descEdit = mk('Description de l’intervention', 'textarea', p.workDescription || '', true);
    descEdit.rows = 2;
    const startEdit = mk('Début', 'datetime-local', p.startDate ? p.startDate.slice(0, 16) : '');
    const endEdit = mk('Fin', 'datetime-local', p.endDate ? p.endDate.slice(0, 16) : '');
    const risksEdit = mk(
      'Risques d’interférence (un par ligne, séparer mesure par " :: ")',
      'textarea',
      (Array.isArray(p.risksJson) ? p.risksJson : [])
        .map((r) => (r.measure ? `${r.description} :: ${r.measure}` : r.description))
        .join('\n'),
      true
    );
    risksEdit.rows = 3;

    const btnRow = document.createElement('div');
    btnRow.className = 'field-full';
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Enregistrer';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-ghost';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.addEventListener('click', () => onDone());
    saveBtn.addEventListener('click', async () => {
      const externalCompanyName = companyEdit.value.trim();
      if (!externalCompanyName) {
        showToast('Le nom de l’entreprise extérieure est requis', 'error');
        return;
      }
      saveBtn.disabled = true;
      try {
        const r = await qhseFetch(`/api/prevention-plans/${encodeURIComponent(p.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalCompanyName,
            externalContact: contactEdit.value.trim() || '',
            siteId: siteSelect.value || '',
            permitId: permitSelect.value || '',
            workDescription: descEdit.value.trim() || '',
            startDate: startEdit.value ? new Date(startEdit.value).toISOString() : '',
            endDate: endEdit.value ? new Date(endEdit.value).toISOString() : '',
            risks: parseRisksInput(risksEdit.value)
          })
        });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          showToast(typeof body.error === 'string' ? body.error : 'Modification impossible', 'error');
          return;
        }
        showToast('Plan de prévention modifié', 'info');
        await onDone(true);
      } catch {
        showToast('Erreur serveur', 'error');
      } finally {
        saveBtn.disabled = false;
      }
    });
    btnRow.append(saveBtn, cancelBtn);
    wrap.append(btnRow);
    return wrap;
  }

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const qs = new URLSearchParams();
      if (siteFilterSel.value) qs.set('siteId', siteFilterSel.value);
      if (statusFilterSel.value && statusFilterSel.value !== 'all') qs.set('status', statusFilterSel.value);
      const query = qs.toString();
      const res = await qhseFetch(`/api/prevention-plans${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        renderKpis([]);
        renderExpiryBanner([]);
        listHost.replaceChildren();
        listHost.append(
          createEmptyState(
            '\u{1F4CB}',
            'Aucun plan de prévention',
            'Créez le premier plan ci-dessous avant l’intervention d’une entreprise extérieure.'
          )
        );
        return;
      }
      renderKpis(rows);
      renderExpiryBanner(rows);
      listHost.replaceChildren();
      rows.forEach((p) => {
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
        title.textContent = `${p.ref} — ${p.externalCompanyName}`;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [];
        if (p.workDescription) parts.push(p.workDescription);
        if (p.inspectionDate) parts.push(`Inspection : ${fmtDate(p.inspectionDate)}`);
        if (p.startDate) parts.push(`Du ${fmtDate(p.startDate)}`);
        if (p.endDate) parts.push(`au ${fmtDate(p.endDate)}`);
        const siteName = p.siteId ? sitesCatalog.find((s) => s.id === p.siteId)?.name : '';
        if (siteName) parts.push(`Site : ${siteName}`);
        const permit = p.permitId ? ptwCatalog.find((x) => x.id === p.permitId) : null;
        if (permit) parts.push(`PTW : ${ptwOptionLabel(permit)}`);
        sub.textContent = parts.join(' · ');
        left.append(title, sub);
        const badge = document.createElement('span');
        badge.textContent = statusLabel(p.status);
        badge.style.fontSize = '11px';
        badge.style.fontWeight = '700';
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '999px';
        badge.style.color = '#fff';
        badge.style.background = p.status === 'validated' ? '#16a34a' : p.status === 'closed' ? '#64748b' : '#d97706';
        head.append(left, badge);
        row.append(head);

        if (isExpiringSoon(p)) {
          const expBadge = document.createElement('span');
          expBadge.textContent = 'Échéance proche';
          expBadge.style.alignSelf = 'flex-start';
          expBadge.style.fontSize = '11px';
          expBadge.style.fontWeight = '700';
          expBadge.style.padding = '2px 8px';
          expBadge.style.borderRadius = '999px';
          expBadge.style.color = '#fff';
          expBadge.style.background = '#dc2626';
          row.append(expBadge);
        }

        const risks = Array.isArray(p.risksJson) ? p.risksJson : [];
        if (risks.length > 0) {
          const risksList = document.createElement('ul');
          risksList.style.margin = '0';
          risksList.style.paddingLeft = '18px';
          risksList.style.fontSize = '12px';
          risksList.style.color = 'var(--text2)';
          risks.forEach((r) => {
            const li = document.createElement('li');
            li.textContent = r.measure ? `${r.description} — mesure : ${r.measure}` : r.description;
            risksList.append(li);
          });
          row.append(risksList);
        }

        const editHost = document.createElement('div');
        row.append(editHost);

        const sigGrid = document.createElement('div');
        sigGrid.style.display = 'grid';
        sigGrid.style.gridTemplateColumns = '1fr 1fr';
        sigGrid.style.gap = '12px';
        sigGrid.append(
          renderSignaturePanel(p, 'client', 'Client', refreshList),
          renderSignaturePanel(p, 'contractor', 'Entreprise extérieure', refreshList)
        );
        row.append(sigGrid);

        if (canWrite) {
          const actionsRow = document.createElement('div');
          actionsRow.style.display = 'flex';
          actionsRow.style.gap = '8px';
          actionsRow.style.alignSelf = 'flex-end';

          const editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.className = 'btn btn-secondary';
          editBtn.textContent = 'Modifier';
          editBtn.addEventListener('click', () => {
            const isEditing = editHost.childElementCount > 0;
            if (isEditing) {
              editHost.replaceChildren();
              return;
            }
            editHost.replaceChildren(
              renderEditForm(p, async (saved) => {
                if (saved) {
                  await refreshList();
                } else {
                  editHost.replaceChildren();
                }
              })
            );
          });
          actionsRow.append(editBtn);

          if (p.status !== 'closed') {
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'btn btn-secondary';
            closeBtn.textContent = 'Clôturer';
            closeBtn.addEventListener('click', async () => {
              if (!window.confirm('Clôturer ce plan de prévention ? L’intervention est considérée comme terminée.')) return;
              try {
                const r = await qhseFetch(`/api/prevention-plans/${encodeURIComponent(p.id)}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'closed' })
                });
                if (!r.ok) throw new Error('close failed');
                showToast('Plan clôturé', 'info');
                await refreshList();
              } catch {
                showToast('Clôture impossible', 'error');
              }
            });
            actionsRow.append(closeBtn);
          }

          const linkActionBtn = document.createElement('button');
          linkActionBtn.type = 'button';
          linkActionBtn.className = 'btn btn-secondary';
          linkActionBtn.textContent = 'Créer une action liée';
          linkActionBtn.addEventListener('click', () => {
            void createLinkedActionFromPreventionPlan(p);
          });
          actionsRow.append(linkActionBtn);

          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer ce plan de prévention ?')) return;
            try {
              const r = await qhseFetch(`/api/prevention-plans/${encodeURIComponent(p.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Plan supprimé', 'info');
              await refreshList();
            } catch {
              showToast('Suppression impossible', 'error');
            }
          });
          actionsRow.append(delBtn);

          row.append(actionsRow);
        }

        listHost.append(row);
      });
    } catch {
      listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Liste indisponible : vérifiez l’API.</p>';
    }
  }

  createBtn.addEventListener('click', async () => {
    if (!canWrite && su) {
      showToast('Création réservée', 'warning');
      return;
    }
    const externalCompanyName = companyIn.value.trim();
    if (!externalCompanyName) {
      showToast('Le nom de l’entreprise extérieure est requis', 'error');
      return;
    }
    const externalContact = contactIn.value.trim() || undefined;
    const workDescription = descriptionIn.value.trim() || undefined;
    const inspectionDate = inspectionIn.value ? new Date(inspectionIn.value).toISOString() : undefined;
    const startDate = startIn.value ? new Date(startIn.value).toISOString() : undefined;
    const endDate = endIn.value ? new Date(endIn.value).toISOString() : undefined;
    const risks = parseRisksInput(risksIn.value);
    const siteId = siteIn.value || undefined;
    const permitId = permitIn.value || undefined;
    createBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/prevention-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalCompanyName,
          externalContact,
          workDescription,
          inspectionDate,
          startDate,
          endDate,
          risks,
          siteId,
          permitId
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Plan de prévention créé', 'info');
      companyIn.value = '';
      contactIn.value = '';
      inspectionIn.value = '';
      descriptionIn.value = '';
      startIn.value = '';
      endIn.value = '';
      risksIn.value = '';
      siteIn.value = '';
      permitIn.value = '';
      await refreshList();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });

  siteFilterSel.addEventListener('change', () => refreshList());
  statusFilterSel.addEventListener('change', () => refreshList());

  refreshList();
  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'prevention-plans-page-anchor';
  return page;
}

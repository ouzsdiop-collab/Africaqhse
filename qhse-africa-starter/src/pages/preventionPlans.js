import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { createEmptyState } from '../utils/designSystem.js';

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

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/prevention-plans');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
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
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.style.alignSelf = 'flex-end';
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
          row.append(delBtn);
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
          risks
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
      await refreshList();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });

  refreshList();
  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'prevention-plans-page-anchor';
  return page;
}

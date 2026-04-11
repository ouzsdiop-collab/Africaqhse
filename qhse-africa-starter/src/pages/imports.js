import { showToast } from '../components/toast.js';
import { mountPageViewModeSwitch } from '../utils/pageViewMode.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { saveImportDraft } from '../utils/importDraft.js';
import { escapeHtml } from '../utils/escapeHtml.js';

function labelImportStatus(status) {
  switch (status) {
    case 'analysis_only':
      return 'Analyse seule';
    case 'validated':
      return 'Import validé';
    case 'failed':
      return 'Échec validation';
    case 'analysis_failed':
      return 'Échec analyse';
    default:
      return status ? String(status) : '—';
  }
}

const QHSE_IMPORT_INTENT_KEY = 'qhse_import_intent_v1';

function createImportContextBanner() {
  let raw = '';
  try {
    raw = sessionStorage.getItem(QHSE_IMPORT_INTENT_KEY) || '';
  } catch {
    return null;
  }
  const map = {
    risks: {
      title: 'Contexte actif : risques',
      desc: 'Orientation import vers enrichissement du registre risques — extraction IA indicative, validation humaine requise avant enregistrement.'
    },
    fds: {
      title: 'Contexte actif : FDS / produits',
      desc: 'Orientation import vers Produits / FDS — même flux fichier ; rattachement et visa côté module cible.'
    },
    iso: {
      title: 'Contexte actif : ISO / exigences',
      desc: 'Orientation import vers SMS & exigences — preuves et documents maîtrisés sous contrôle humain.'
    }
  };
  const m = map[raw];
  if (!m) return null;

  const art = document.createElement('article');
  art.className = 'content-card card-soft';
  art.style.marginBottom = '14px';
  art.style.border = '1px solid rgba(167,139,250,.28)';
  art.style.background = 'linear-gradient(135deg,rgba(167,139,250,.1),rgba(255,255,255,.02))';
  art.setAttribute('data-import-context-banner', '1');
  art.innerHTML = `
    <div class="content-card-head content-card-head--split" style="align-items:flex-start;gap:12px">
      <div>
        <div class="section-kicker">Import contextuel</div>
        <h3 style="margin:0 0 8px;font-size:15px">${m.title}</h3>
        <p class="content-card-lead" style="margin:0;max-width:58ch;font-size:13px;line-height:1.55;color:var(--text2)">${m.desc}</p>
      </div>
      <button type="button" class="btn btn-secondary" data-import-context-dismiss>Fermer le contexte</button>
    </div>
  `;
  art.querySelector('[data-import-context-dismiss]')?.addEventListener('click', () => {
    try {
      sessionStorage.removeItem(QHSE_IMPORT_INTENT_KEY);
    } catch {
      /* ignore */
    }
    art.remove();
  });
  return art;
}

function labelDetectedDocType(v) {
  switch (v) {
    case 'audit':
      return 'Audit';
    case 'incident':
      return 'Incident';
    case 'fds':
      return 'FDS / produit';
    case 'iso':
      return 'Document ISO / SMS';
    case 'unknown':
      return 'Inconnu / non classé';
    default:
      return v ? String(v) : '—';
  }
}

function formatPreviewPayload(body) {
  const mod = body.suggestedModule;
  const modLine =
    mod && (mod.label || mod.pageId)
      ? `${mod.label ?? '—'}${mod.pageId ? ` (module : ${mod.pageId})` : ''}`
      : '—';

  const hints = Array.isArray(body.detectedHints)
    ? body.detectedHints.slice(0, 8)
    : [];
  const hintsBlock =
    hints.length > 0
      ? ['Indices repérés :', ...hints.map((h) => `  • ${h}`), '']
      : ['Indices repérés : —', ''];

  const preAnalysis =
    body.detectedDocumentType !== undefined
      ? [
          '— — —',
          'Pré-analyse métier (indicatif)',
          `Type document suggéré : ${labelDetectedDocType(body.detectedDocumentType)}`,
          `Confiance : ${typeof body.confidence === 'number' ? `${body.confidence} %` : '—'}`,
          `Module suggéré : ${modLine}`,
          ...hintsBlock,
          '— — —',
          ''
        ]
      : [];

  const prefillBlock =
    body.prefillData && typeof body.prefillData === 'object'
      ? [
          'Brouillon préremplissage (à valider manuellement)',
          JSON.stringify(body.prefillData, null, 2),
          Array.isArray(body.missingFields) && body.missingFields.length
            ? `Champs probablement manquants : ${body.missingFields.join(', ')}`
            : '',
          '— — —',
          ''
        ]
      : [];

  const lines = [
    body.importHistoryId
      ? `Trace import : ${body.importHistoryId}`
      : '',
    `Format fichier : ${body.fileType ?? body.detectedType ?? '—'}`,
    `Fichier : ${body.originalName ?? '—'}`,
    `MIME : ${body.mimeType ?? '—'}`,
    `Métadonnées : ${JSON.stringify(body.meta ?? {}, null, 2)}`,
    ...preAnalysis,
    ...prefillBlock
  ];
  const p = body.preview;
  if (p?.kind === 'text') {
    lines.push(p.text ?? '');
  } else if (p?.kind === 'sheet') {
    lines.push(
      `Feuilles : ${(p.sheetNames || []).join(', ')}`,
      `Feuille active : ${p.activeSheet ?? '—'}`,
      `Lignes (aperçu) : ${Array.isArray(p.rows) ? p.rows.length : 0}`,
      ''
    );
    (p.rows || []).forEach((row) => {
      lines.push(Array.isArray(row) ? row.join('\t') : String(row));
    });
    if (p.truncated) lines.push('\n[… lignes ou colonnes tronquées]');
  } else {
    lines.push(JSON.stringify(body, null, 2));
  }
  return lines.join('\n');
}

export function renderImports() {
  ensureQhsePilotageStyles();

  const su = getSessionUser();
  const canWrite = canResource(su?.role, 'imports', 'write');
  const canReadHistory = canResource(su?.role, 'imports', 'read');

  let lastImportHistoryId = null;

  const page = document.createElement('section');
  page.className = 'page-stack';

  const { bar: importsPageViewBar } = mountPageViewModeSwitch({
    pageId: 'imports',
    pageRoot: page,
    hintEssential:
      'Fichier + analyse + brouillon de préremplissage — feuille de route, sortie brute et historique masqués.',
    hintAdvanced: 'Feuille de route imports, aperçu JSON brut complet et historique des traitements.'
  });

  const roadmap = document.createElement('article');
  roadmap.className = 'content-card card-soft qhse-page-advanced-only';
  roadmap.style.marginBottom = '14px';
  roadmap.style.border = '1px solid rgba(125,211,252,.22)';
  roadmap.style.background = 'linear-gradient(135deg,rgba(56,189,248,.08),rgba(255,255,255,.02))';
  roadmap.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Feuille de route</div>
        <h3 style="margin:0 0 8px;font-size:16px">Imports contextuels (préparation)</h3>
        <p class="content-card-lead" style="margin:0;max-width:62ch;font-size:13px;line-height:1.55;color:var(--text2)">
          Prochaine étape : déclencher l’import depuis <strong>Risques</strong>, <strong>Produits / FDS</strong> et <strong>ISO &amp; Conformité</strong>, avec extraction assistée puis
          <strong>validation humaine</strong> systématique. Cette page centrale reste le point d’entrée fichier unique.
        </p>
      </div>
    </div>
  `;
  page.append(importsPageViewBar, roadmap);
  const ctxBanner = createImportContextBanner();
  if (ctxBanner) page.append(ctxBanner);

  const card = document.createElement('article');
  card.className = 'content-card card-soft';
  card.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Documents</div>
        <h3>Import intelligent — phase 1</h3>
        <p class="content-card-lead" style="margin:0;max-width:54ch;font-size:14px;line-height:1.5;color:var(--text2)">
          PDF ou Excel : aperçu brut, pré-analyse et brouillon de préremplissage indicatif — rien n’est enregistré sans votre validation sur le module cible.
        </p>
      </div>
    </div>
  `;

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px';

  const input = document.createElement('input');
  input.type = 'file';
  input.accept =
    '.pdf,.xlsx,.xls,.xlsm,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  input.className = 'control-input';
  input.setAttribute('aria-label', 'Fichier à importer');
  input.style.flex = '1';
  input.style.minWidth = '200px';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary';
  btn.textContent = 'Analyser le fichier';

  const out = document.createElement('pre');
  out.className = 'qhse-page-advanced-only';
  out.setAttribute('aria-live', 'polite');
  out.style.cssText =
    'margin-top:16px;padding:12px;border-radius:8px;background:rgba(0,0,0,.04);font-size:12px;line-height:1.45;overflow:auto;max-height:min(52vh,420px);white-space:pre-wrap;word-break:break-word;color:var(--text2)';

  const draftPanel = document.createElement('div');
  draftPanel.className = 'import-draft-panel';
  draftPanel.style.cssText =
    'display:none;margin-top:14px;padding:12px;border-radius:8px;background:rgba(0,0,0,.03);font-size:13px;line-height:1.45;color:var(--text2)';
  draftPanel.setAttribute('aria-live', 'polite');

  if (!canWrite && su) {
    btn.disabled = true;
    btn.style.opacity = '0.55';
    btn.title = 'Import réservé (ex. QHSE, Assistant)';
  }

  btn.addEventListener('click', async () => {
    const file = input.files?.[0];
    if (!file) {
      showToast('Choisissez un fichier.', 'warning');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    btn.disabled = true;
    try {
      const res = await qhseFetch('/api/imports/preview', {
        method: 'POST',
        body: fd
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastImportHistoryId = null;
        showToast(
          typeof body.error === 'string' ? body.error : 'Import impossible',
          'error'
        );
        out.textContent = '';
        draftPanel.style.display = 'none';
        draftPanel.replaceChildren();
        refreshHistory();
        return;
      }
      lastImportHistoryId =
        typeof body.importHistoryId === 'string' ? body.importHistoryId : null;
      out.textContent = formatPreviewPayload(body);
      draftPanel.replaceChildren();
      const pid = body.suggestedModule?.pageId;
      const hasPrefill =
        body.prefillData &&
        typeof body.prefillData === 'object' &&
        body.detectedDocumentType &&
        body.detectedDocumentType !== 'unknown';
      if (hasPrefill) {
        draftPanel.style.display = 'block';
        const title = document.createElement('div');
        title.style.fontWeight = '700';
        title.style.marginBottom = '8px';
        title.textContent = 'Brouillon de préremplissage (indicatif — rien n’est enregistré sans votre action)';
        draftPanel.append(title);
        const dl = document.createElement('dl');
        dl.style.cssText = 'margin:0;display:grid;gap:6px 12px;grid-template-columns:auto 1fr;max-width:72ch';
        Object.entries(body.prefillData).forEach(([k, v]) => {
          if (v === null || v === undefined || v === '') return;
          const dt = document.createElement('dt');
          dt.style.opacity = '0.85';
          dt.textContent = k;
          const dd = document.createElement('dd');
          dd.style.margin = '0';
          dd.textContent =
            typeof v === 'object' ? JSON.stringify(v) : String(v);
          dl.append(dt, dd);
        });
        draftPanel.append(dl);
        if (Array.isArray(body.missingFields) && body.missingFields.length) {
          const miss = document.createElement('p');
          miss.style.cssText = 'margin:10px 0 0;font-size:12px;color:var(--text3)';
          miss.textContent = `À compléter probablement : ${body.missingFields.join(', ')}`;
          draftPanel.append(miss);
        }
        const actions = document.createElement('div');
        actions.style.cssText =
          'display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center';
        if (pid === 'incidents') {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn btn-primary';
          b.textContent = 'Ouvrir la déclaration incident avec ce brouillon';
          b.addEventListener('click', () => {
            saveImportDraft({
              targetPageId: 'incidents',
              prefillData: body.prefillData,
              missingFields: body.missingFields,
              detectedDocumentType: body.detectedDocumentType
            });
            window.location.hash = 'incidents';
          });
          actions.append(b);
        }
        if (pid === 'audits') {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn btn-primary';
          b.textContent = 'Ouvrir Audits pour valider la création';
          b.addEventListener('click', () => {
            saveImportDraft({
              targetPageId: 'audits',
              prefillData: body.prefillData,
              missingFields: body.missingFields,
              detectedDocumentType: body.detectedDocumentType
            });
            window.location.hash = 'audits';
          });
          actions.append(b);
        }
        if (pid === 'products' || pid === 'iso') {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn';
          b.textContent = 'Copier le brouillon (JSON)';
          b.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(
                JSON.stringify(body.prefillData, null, 2)
              );
              showToast('Brouillon copié', 'info');
            } catch {
              showToast('Copie impossible', 'warning');
            }
          });
          actions.append(b);
        }
        if (pid === 'incidents' || pid === 'audits') {
          const confirmBtn = document.createElement('button');
          confirmBtn.type = 'button';
          confirmBtn.className = 'btn';
          confirmBtn.textContent = 'Valider le brouillon et enregistrer en base';
          confirmBtn.addEventListener('click', async () => {
            if (
              !(await ensureSensitiveAccess('sensitive_mutation', {
                contextLabel: 'enregistrement en base après import analysé'
              }))
            ) {
              return;
            }
            const validatedData =
              pid === 'incidents'
                ? {
                    ...body.prefillData,
                    severity:
                      body.prefillData?.severity ??
                      body.prefillData?.gravite ??
                      ''
                  }
                : { ...body.prefillData };
            confirmBtn.disabled = true;
            try {
              const res = await qhseFetch('/api/imports/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  targetModule: pid,
                  suggestedModule: body.suggestedModule,
                  validatedData,
                  sourceFileName: body.originalName ?? null,
                  importHistoryId: lastImportHistoryId
                })
              });
              const json = await res.json().catch(() => ({}));
              if (res.ok && json.success) {
                const ref = json.createdEntityRef || json.createdEntityId;
                showToast(
                  `Enregistré : ${ref}${json.moduleCreated ? ` (${json.moduleCreated})` : ''}`,
                  'info'
                );
                if (Array.isArray(json.warnings) && json.warnings.length) {
                  showToast(json.warnings[0], 'warning');
                }
                window.location.hash = pid;
                refreshHistory();
                return;
              }
              const w =
                (Array.isArray(json.warnings) && json.warnings[0]) ||
                json.error ||
                'Enregistrement impossible';
              showToast(w, 'error');
              refreshHistory();
            } catch (e) {
              console.error(e);
              showToast('Erreur réseau', 'error');
            } finally {
              confirmBtn.disabled = false;
            }
          });
          actions.append(confirmBtn);
        }
        if (pid === 'products' || pid === 'iso') {
          const tryBtn = document.createElement('button');
          tryBtn.type = 'button';
          tryBtn.className = 'btn';
          tryBtn.style.opacity = '0.92';
          tryBtn.textContent = 'Tester la persistance serveur';
          tryBtn.addEventListener('click', async () => {
            tryBtn.disabled = true;
            try {
              const res = await qhseFetch('/api/imports/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  targetModule: pid,
                  validatedData: body.prefillData,
                  sourceFileName: body.originalName ?? null,
                  importHistoryId: lastImportHistoryId
                })
              });
              const json = await res.json().catch(() => ({}));
              const w =
                (Array.isArray(json.warnings) && json.warnings[0]) ||
                'Réponse inattendue';
              showToast(w, res.ok ? 'info' : 'warning');
              refreshHistory();
            } catch (e) {
              console.error(e);
              showToast('Erreur réseau', 'error');
            } finally {
              tryBtn.disabled = false;
            }
          });
          actions.append(tryBtn);
        }
        if (actions.children.length) draftPanel.append(actions);
      } else {
        draftPanel.style.display = 'none';
      }
      showToast('Aperçu généré', 'info');
      refreshHistory();
    } catch (e) {
      console.error(e);
      showToast('Erreur réseau', 'error');
    } finally {
      btn.disabled = !canWrite && !!su;
      if (canWrite || !su) btn.disabled = false;
    }
  });

  const historyCard = document.createElement('article');
  historyCard.className = 'content-card card-soft qhse-page-advanced-only';
  historyCard.style.marginTop = '14px';
  historyCard.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Traçabilité</div>
        <h3>Historique des imports</h3>
        <p class="content-card-lead" style="margin:0;max-width:56ch;font-size:13px">
          Dernières analyses et validations (lecture seule si vous n’avez pas l’import en écriture).
        </p>
      </div>
    </div>
  `;
  const historyHost = document.createElement('div');
  historyHost.className = 'stack';
  historyHost.style.marginTop = '10px';
  const historyDetail = document.createElement('pre');
  historyDetail.style.cssText =
    'display:none;margin-top:12px;padding:12px;border-radius:8px;background:rgba(0,0,0,.04);font-size:11px;line-height:1.45;overflow:auto;max-height:240px;white-space:pre-wrap;word-break:break-word;color:var(--text2)';
  historyCard.append(historyHost, historyDetail);

  let historyDetailId = null;

  async function refreshHistory() {
    if (!canReadHistory && su) {
      historyHost.innerHTML =
        '<p style="margin:0;font-size:13px;color:var(--text3)">Historique non disponible pour ce rôle.</p>';
      return;
    }
    historyHost.replaceChildren();
    historyDetail.style.display = 'none';
    historyDetail.textContent = '';
    historyDetailId = null;
    try {
      const res = await qhseFetch('/api/imports');
      if (!res.ok) {
        const errP = document.createElement('p');
        errP.style.cssText = 'margin:0;font-size:13px;color:var(--text3)';
        const j = await res.json().catch(() => ({}));
        errP.textContent =
          typeof j.error === 'string'
            ? j.error
            : `Impossible de charger l’historique (${res.status}).`;
        historyHost.append(errP);
        return;
      }
      const rows = await res.json().catch(() => []);
      if (!Array.isArray(rows) || rows.length === 0) {
        const empty = document.createElement('p');
        empty.style.cssText = 'margin:0;font-size:13px;color:var(--text3)';
        empty.textContent = 'Aucun import enregistré pour le moment.';
        historyHost.append(empty);
        return;
      }
      rows.forEach((row) => {
        const art = document.createElement('article');
        art.className = 'list-row';
        art.style.cssText =
          'display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;justify-content:space-between';
        const left = document.createElement('div');
        const d = row.createdAt
          ? new Date(row.createdAt).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short'
            })
          : '—';
        const modSug = escapeHtml(row.suggestedModule || '—');
        const modCreated = row.moduleCreated ? escapeHtml(row.moduleCreated) : '';
        left.innerHTML = `
          <strong style="font-size:13px">${escapeHtml(String(row.fileName || '—'))}</strong>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text2)">
            ${escapeHtml(d)} · ${escapeHtml(String(row.fileType || '—'))} · ${escapeHtml(labelDetectedDocType(row.detectedDocumentType))}
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text3)">
            Module suggéré : ${modSug}
            ${row.moduleCreated ? ` · Créé : ${modCreated}` : ''}
          </p>
        `;
        const right = document.createElement('div');
        right.style.cssText =
          'display:flex;flex-direction:column;align-items:flex-end;gap:6px';
        const badge = document.createElement('span');
        badge.className = 'badge info';
        badge.style.fontSize = '11px';
        badge.textContent = labelImportStatus(row.status);
        const detBtn = document.createElement('button');
        detBtn.type = 'button';
        detBtn.className = 'text-button';
        detBtn.style.fontSize = '12px';
        detBtn.style.fontWeight = '700';
        detBtn.textContent = 'Détail';
        detBtn.addEventListener('click', async () => {
          if (historyDetailId === row.id && historyDetail.style.display === 'block') {
            historyDetail.style.display = 'none';
            historyDetailId = null;
            return;
          }
          try {
            const dr = await qhseFetch(`/api/imports/${encodeURIComponent(row.id)}`);
            const detail = await dr.json().catch(() => null);
            historyDetail.textContent = JSON.stringify(detail, null, 2);
            historyDetail.style.display = 'block';
            historyDetailId = row.id;
          } catch {
            showToast('Détail indisponible', 'error');
          }
        });
        right.append(badge, detBtn);
        art.append(left, right);
        historyHost.append(art);
      });
    } catch {
      const errP = document.createElement('p');
      errP.style.cssText = 'margin:0;font-size:13px;color:var(--text3)';
      errP.textContent = 'Erreur réseau (historique).';
      historyHost.append(errP);
    }
  }

  row.append(input, btn);
  card.append(row, out, draftPanel);
  page.append(card, historyCard);
  refreshHistory();
  return page;
}

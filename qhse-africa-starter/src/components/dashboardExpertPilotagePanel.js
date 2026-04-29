import { escapeHtml } from '../utils/escapeHtml.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';
import { withSiteQuery } from '../utils/siteFilter.js';

function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function clampScore100(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function ensureList(v) {
  return Array.isArray(v) ? v : [];
}

function stripLongDashes(s) {
  return String(s || '').replaceAll('—', '-').replaceAll('–', '-');
}

function mkSparkline(values, opts = {}) {
  const arr = ensureList(values).map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (arr.length < 2) return '';
  const w = 160;
  const h = 42;
  const pad = 3;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const span = Math.max(1e-9, max - min);
  const pts = arr.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (arr.length - 1);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = opts.stroke || 'rgba(20,184,166,.9)';
  const fill = opts.fill || 'rgba(20,184,166,.12)';
  const line = pts.join(' ');
  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">
      <polyline points="${escapeHtml(line)}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
      <polyline points="${escapeHtml(line)} ${w - pad},${h - pad} ${pad},${h - pad}" fill="${fill}" stroke="none"></polyline>
    </svg>
  `;
}

function computeSubScores({ stats, snapMeta, docSummary, ncOpenCount, hab }) {
  const overdue = Math.max(0, Number(snapMeta?.overdue) || 0);
  const critInc =
    Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : Math.max(0, Number(snapMeta?.criticalIncidents) || 0);
  const expiredDocs = Math.max(0, Number(docSummary?.expire) || 0);
  const ncOpen = Math.max(0, Number(ncOpenCount) || 0);
  const habExpired = Math.max(0, Number(hab?.expired || 0));
  const habExpiring = Math.max(0, Number(hab?.expiring || 0));

  const actions = clampScore100(100 - Math.min(overdue * 7, 49));
  const incidents = clampScore100(100 - Math.min(critInc * 20, 60));
  const conformity = clampScore100(100 - Math.min(expiredDocs * 18, 54) - Math.min(ncOpen * 6, 36));
  const habilitations =
    habExpired + habExpiring > 0 ? clampScore100(100 - Math.min(habExpired * 24 + habExpiring * 6, 70)) : null;

  return { actions, incidents, conformity, habilitations };
}

function computeAuditQuestions(req) {
  const title = String(req?.title || '').trim();
  const summary = String(req?.summary || '').trim();
  const base = title || summary || 'Cette exigence';
  const q1 = `Comment démontrez-vous que “${base}” est appliqué sur le terrain ?`;
  const q2 = `Quelles preuves sont disponibles (documents, enregistrements, observations) ?`;
  const q3 = `Comment traitez-vous les écarts détectés (actions, délais, validation) ?`;
  return [q1, q2, q3].map(stripLongDashes);
}

export function createDashboardExpertPilotagePanel() {
  const root = document.createElement('section');
  root.className = 'dashboard-section dashboard-expert-pilotage qhse-page-advanced-only';

  root.innerHTML = `
    <article class="content-card card-soft">
      <div class="content-card-head content-card-head--split">
        <div>
          <div class="section-kicker">Analyse</div>
          <h3 class="content-card-title">Pilotage expert</h3>
          <p class="content-card-lead">Score détaillé · raisons · drill-down · compliance · tendances.</p>
        </div>
        <div style="text-align:right">
          <div style="font-weight:900;font-size:22px;letter-spacing:-.02em" data-score>—</div>
          <div style="font-size:11px;color:var(--text2,#94a3b8)">Score global / 100</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.05fr .95fr;gap:14px">
        <section style="border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 12px 14px">
          <div class="section-kicker" style="opacity:.9">Détail du score</div>
          <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px" data-subscores></div>
          <p style="margin:10px 0 0;font-size:12px;color:var(--text2,#94a3b8);line-height:1.4" data-score-reasons></p>
          <div style="margin-top:10px;font-size:12px;color:var(--text2,#94a3b8)" data-data-quality></div>
          <div style="margin-top:8px;font-size:12px;color:var(--text2,#94a3b8)" data-signal-sources></div>
        </section>

        <section style="border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 12px 14px">
          <div class="section-kicker" style="opacity:.9">Drill-down</div>
          <div style="display:grid;gap:10px;margin-top:10px" data-drill></div>
        </section>

        <section style="border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 12px 14px">
          <div class="section-kicker" style="opacity:.9">Historique (léger)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px" data-history></div>
        </section>

        <section style="border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 12px 14px">
          <div class="section-kicker" style="opacity:.9">IA utile</div>
          <p style="margin:10px 0 0;font-size:12px;color:var(--text2,#94a3b8)" data-ai-narrative>Aucune recommandation IA chargée.</p>
          <ul style="margin:10px 0 0;padding-left:16px;display:grid;gap:8px" data-ai-actions></ul>
        </section>
      </div>

      <section style="margin-top:14px;border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 12px 14px">
        <div class="section-kicker" style="opacity:.9">Explications (toutes)</div>
        <div data-all-reasons style="display:grid;gap:10px;margin-top:10px"></div>
      </section>

      <section style="margin-top:14px;border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 12px 14px">
        <div class="section-kicker" style="opacity:.9">SMI</div>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:10px;margin-top:6px">
          <div>
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
              <div style="font-weight:900;font-size:16px">SMI Overview</div>
              <button type="button" class="btn btn-secondary" data-smi-reload style="font-size:11px;padding:4px 10px">Recharger</button>
            </div>
            <div style="margin-top:4px;font-size:12px;color:var(--text2,#94a3b8)" data-smi-status>Non chargé.</div>
          </div>
          <div style="text-align:right;min-width:190px">
            <div style="font-weight:900;font-size:22px;letter-spacing:-.02em" data-smi-score>—</div>
            <div style="font-size:11px;color:var(--text2,#94a3b8)">Score global SMI / 100</div>
          </div>
        </div>

        <div data-smi-host style="margin-top:10px;display:none"></div>
      </section>

      <details style="margin-top:14px" data-compliance-details>
        <summary style="cursor:pointer;font-weight:900">Compliance (CI · ISO 45001 · mines) - charger à la demande</summary>
        <div style="margin-top:10px;border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 12px 14px">
          <p style="margin:0 0 10px;font-size:12px;color:var(--text2,#94a3b8)" data-compliance-disclaimer></p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
            <button type="button" class="btn btn-secondary" data-load-compliance>Charger</button>
            <button type="button" class="btn btn-secondary" data-open-iso>Ouvrir ISO</button>
            <button type="button" class="btn btn-secondary" data-export-premium>Exporter PDF premium</button>
          </div>
          <div data-compliance-status style="font-size:12px;color:var(--text2,#94a3b8)">Non chargé.</div>
          <div data-compliance-host style="display:none;margin-top:10px"></div>
        </div>
      </details>
    </article>
  `;

  const elScore = root.querySelector('[data-score]');
  const elSub = root.querySelector('[data-subscores]');
  const elReasons = root.querySelector('[data-score-reasons]');
  const elDQ = root.querySelector('[data-data-quality]');
  const elSS = root.querySelector('[data-signal-sources]');
  const elDrill = root.querySelector('[data-drill]');
  const elHistory = root.querySelector('[data-history]');
  const elAiNarr = root.querySelector('[data-ai-narrative]');
  const elAiActs = root.querySelector('[data-ai-actions]');
  const elAll = root.querySelector('[data-all-reasons]');
  const complianceDetails = root.querySelector('[data-compliance-details]');
  const complianceStatus = root.querySelector('[data-compliance-status]');
  const complianceHost = root.querySelector('[data-compliance-host]');
  const complianceDisclaimer = root.querySelector('[data-compliance-disclaimer]');
  const smiStatus = root.querySelector('[data-smi-status]');
  const smiScore = root.querySelector('[data-smi-score]');
  const smiHost = root.querySelector('[data-smi-host]');
  const smiReloadBtn = root.querySelector('[data-smi-reload]');

  /** @type {{ pilotage: any; stats: any; hab: {expired:number, expiring:number}|null }} */
  const state = { pilotage: null, stats: null, hab: null };
  /** @type {any|null} */
  let cachedCompliance = null;
  let complianceLoading = false;
  /** @type {any|null} */
  let cachedSmi = null;
  let smiLoading = false;
  /** @type {string} */
  let smiCacheKey = '';

  function renderSubScoreCard(label, value) {
    const v = value == null ? '—' : String(value);
    return `
      <div style="border:1px solid rgba(148,163,184,.10);border-radius:12px;padding:10px 10px 12px;background:rgba(255,255,255,.02)">
        <div style="font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--text2,#94a3b8)">${escapeHtml(
          label
        )}</div>
        <div style="margin-top:6px;font-size:20px;font-weight:900;letter-spacing:-.02em">${escapeHtml(v)}</div>
      </div>
    `;
  }

  function dataQualityLabel(v) {
    const s = String(v || '').toLowerCase();
    if (s === 'complete') return 'complete';
    if (s === 'partial') return 'partial';
    return 'unavailable';
  }

  function normLabelFr(code) {
    const s = String(code || '').toLowerCase();
    if (s === 'iso-45001') return 'ISO 45001';
    if (s === 'iso-14001') return 'ISO 14001';
    if (s === 'iso-9001') return 'ISO 9001';
    return s.toUpperCase();
  }

  function readinessBadge(status) {
    const s = String(status || '').toLowerCase();
    const label = s === 'pret' ? 'Prêt' : s === 'fragile' ? 'Fragile' : 'Non prêt';
    const cls = s === 'pret' ? 'green' : s === 'fragile' ? 'amber' : 'red';
    return `<span class="badge ${escapeHtml(cls)}">${escapeHtml(label)}</span>`;
  }

  function renderSmi() {
    if (!smiHost || !smiStatus || !smiScore) return;
    if (smiReloadBtn) smiReloadBtn.disabled = !!smiLoading;
    if (smiLoading) {
      smiHost.style.display = 'none';
      smiStatus.textContent = 'Chargement…';
      smiScore.textContent = '—';
      return;
    }
    if (!cachedSmi || typeof cachedSmi !== 'object') {
      smiHost.style.display = 'none';
      smiStatus.textContent = 'Non disponible.';
      smiScore.textContent = '—';
      return;
    }

    const scoreGlobal = clampScore100(cachedSmi?.scoreGlobal);
    smiScore.textContent = scoreGlobal == null ? '—' : String(scoreGlobal);

    const ar = cachedSmi?.auditReadiness && typeof cachedSmi.auditReadiness === 'object' ? cachedSmi.auditReadiness : null;
    const arStatus = String(ar?.status || '').trim();
    const arMsg = stripLongDashes(String(ar?.message || '').trim());
    smiStatus.textContent = arMsg ? arMsg : 'SMI chargé.';

    const scores = cachedSmi?.scoresParNorme && typeof cachedSmi.scoresParNorme === 'object' ? cachedSmi.scoresParNorme : {};
    const scoreRows = ['iso-45001', 'iso-14001', 'iso-9001']
      .map((k) => {
        const v = clampScore100(scores?.[k]);
        return `<div style="display:flex;justify-content:space-between;gap:10px">
          <span style="color:var(--text2,#94a3b8)">${escapeHtml(normLabelFr(k))}</span>
          <strong>${escapeHtml(v == null ? '—' : String(v))}</strong>
        </div>`;
      })
      .join('');

    const top = ensureList(cachedSmi?.topPriorities).slice(0, 3);
    const topHtml = top.length
      ? `<ul style="margin:8px 0 0;padding-left:16px;display:grid;gap:8px">
          ${top
            .map((p) => {
              const n = String(p?.normLabel || normLabelFr(p?.norm || '')).trim();
              const lbl = stripLongDashes(String(p?.label || '').trim());
              const rs = stripLongDashes(String(p?.reason || '').trim());
              return `<li>
                <strong>${escapeHtml(n)}</strong> - ${escapeHtml(lbl || 'Priorité')}
                ${rs ? `<div style="margin-top:2px;color:var(--text2,#94a3b8);font-size:12px">${escapeHtml(rs)}</div>` : ''}
              </li>`;
            })
            .join('')}
        </ul>`
      : `<p style="margin:8px 0 0;color:var(--text2,#94a3b8);font-size:12px">Aucune priorité critique détectée.</p>`;

    const acts = ensureList(cachedSmi?.recommendedActions).slice(0, 10);
    const actsHtml = acts.length
      ? `<ul style="margin:8px 0 0;padding-left:16px;display:grid;gap:8px">
          ${acts.map((t) => `<li>${escapeHtml(stripLongDashes(String(t)).slice(0, 220))}</li>`).join('')}
        </ul>`
      : `<p style="margin:8px 0 0;color:var(--text2,#94a3b8);font-size:12px">Aucune action recommandée.</p>`;

    smiHost.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px">
        <div style="border:1px solid rgba(148,163,184,.10);border-radius:12px;padding:10px 10px 12px;background:rgba(255,255,255,.02)">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <div style="font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--text2,#94a3b8)">Audit readiness</div>
            ${readinessBadge(arStatus)}
          </div>
          <div style="margin-top:10px;display:grid;gap:6px">${scoreRows}</div>
        </div>
        <div style="border:1px solid rgba(148,163,184,.10);border-radius:12px;padding:10px 10px 12px;background:rgba(255,255,255,.02)">
          <div style="font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--text2,#94a3b8)">Priorités principales</div>
          ${topHtml}
        </div>
      </div>
      <div style="margin-top:12px;border:1px solid rgba(148,163,184,.10);border-radius:12px;padding:10px 10px 12px;background:rgba(255,255,255,.02)">
        <div style="font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--text2,#94a3b8)">Actions recommandées</div>
        ${actsHtml}
      </div>
    `;
    smiHost.style.display = '';
  }

  async function loadSmiOverview(force = false) {
    if (smiLoading) return;
    const nextKey = String(state?.stats?.siteId || '');
    if (!force && cachedSmi && smiCacheKey === nextKey) {
      renderSmi();
      return;
    }
    smiLoading = true;
    smiCacheKey = nextKey;
    renderSmi();
    try {
      const res = await qhseFetch(withSiteQuery('/api/smi/overview'));
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof payload?.error === 'string' && payload.error.trim()
            ? payload.error.trim()
            : `Erreur ${res.status}`;
        throw new Error(msg);
      }
      cachedSmi = payload && typeof payload === 'object' ? payload : null;
    } catch (e) {
      cachedSmi = null;
      if (smiStatus) {
        smiStatus.textContent = stripLongDashes(
          `SMI indisponible pour le moment. ${e && typeof e === 'object' && 'message' in e ? String(e.message || '') : ''}`.trim()
        );
      }
    } finally {
      smiLoading = false;
      renderSmi();
    }
  }

  function updateScoreAndReasons() {
    const pilotage = state.pilotage;
    const stats = state.stats;
    if (!pilotage || !stats) return;

    if (elScore) elScore.textContent = pilotage.score != null ? String(pilotage.score) : '—';

    const subs = pilotage?.subScores && typeof pilotage.subScores === 'object' ? pilotage.subScores : null;
    if (elSub) {
      elSub.innerHTML = [
        renderSubScoreCard('Actions', subs?.actions ?? null),
        renderSubScoreCard('Incidents', subs?.incidents ?? null),
        renderSubScoreCard('Conformité', subs?.conformity ?? null),
        renderSubScoreCard('Risques', subs?.risks ?? null)
      ].join('');
    }

    const top = ensureList(pilotage.topPriorities).slice(0, 3);
    const reasons = top.map((r) => String(r?.reason || '').trim()).filter(Boolean);
    if (elReasons) {
      elReasons.textContent = reasons.length
        ? stripLongDashes(reasons.join(' '))
        : 'Aucune raison principale.';
    }

    const dq = pilotage?.dataQuality && typeof pilotage.dataQuality === 'object' ? pilotage.dataQuality : null;
    if (elDQ) {
      if (!dq) elDQ.textContent = 'Data quality: unavailable.';
      else {
        elDQ.textContent = `Data quality: incidents ${dataQualityLabel(dq.incidents)}, actions ${dataQualityLabel(
          dq.actions
        )}, audits ${dataQualityLabel(dq.audits)}, risks ${dataQualityLabel(dq.risks)}.`;
      }
    }

    const ss = pilotage?.signalSources && typeof pilotage.signalSources === 'object' ? pilotage.signalSources : null;
    if (elSS) {
      if (!ss) elSS.textContent = 'signalSources: unavailable.';
      else {
        elSS.textContent = `signalSources: incidentsTotal ${String(ss.incidentsTotal || 'unavailable')}, actionsOverdue ${String(
          ss.actionsOverdue || 'unavailable'
        )}, auditsSummary ${String(ss.auditsSummary || 'unavailable')}, risksCritical ${String(
          ss.risksCritical || 'unavailable'
        )}.`;
      }
    }

    if (elAll) {
      elAll.replaceChildren();
      const all = ensureList(pilotage.priorities);
      if (!all.length) {
        const p = document.createElement('p');
        p.style.cssText = 'margin:0;color:var(--text2,#94a3b8);font-size:12px';
        p.textContent = 'Aucune explication disponible.';
        elAll.append(p);
      } else {
        all.forEach((r) => {
          const box = document.createElement('div');
          box.style.cssText =
            'border:1px solid rgba(148,163,184,.10);border-radius:12px;padding:12px;background:rgba(0,0,0,.06)';
          box.innerHTML = `
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:baseline">
              <strong style="font-weight:900">${escapeHtml(String(r?.label || 'Priorité').slice(0, 140))}</strong>
              <span class="badge blue">${escapeHtml(String(r?.severity || 'medium'))}</span>
              <span style="font-size:11px;color:var(--text2,#94a3b8)">${escapeHtml(
                String(r?.source || 'deterministic')
              )} · ${escapeHtml(String(r?.confidence || 'low'))}</span>
            </div>
            <p style="margin:8px 0 0;font-size:12px;color:var(--text2,#94a3b8);line-height:1.4">${escapeHtml(
              stripLongDashes(String(r?.reason || '')).slice(0, 420) || 'Non disponible.'
            )}</p>
          `;
          elAll.append(box);
        });
      }
    }
  }

  function updateDrillDown() {
    const pilotage = state.pilotage;
    if (!pilotage || !elDrill) return;
    elDrill.replaceChildren();
    const recs = ensureList(pilotage.topPriorities).slice(0, 3);
    const defaults = [
      { label: 'Actions', navigateHash: 'actions', navigateIntent: { source: 'dashboard_expert_pilotage' } },
      { label: 'Incidents', navigateHash: 'incidents', navigateIntent: { source: 'dashboard_expert_pilotage' } },
      { label: 'Conformité ISO', navigateHash: 'iso', navigateIntent: { source: 'dashboard_expert_pilotage' } }
    ];
    const items = recs.length ? recs : defaults;
    if (!items.length) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;color:var(--text2,#94a3b8);font-size:12px';
      p.textContent = 'Aucun drill-down disponible.';
      elDrill.append(p);
      return;
    }
    items.forEach((r) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary';
      btn.textContent = String(r?.label || 'Ouvrir').slice(0, 120);
      btn.addEventListener('click', () => {
        const pageId = String(r?.navigateHash || '').trim();
        const intent = r?.navigateIntent && typeof r.navigateIntent === 'object' ? r.navigateIntent : {};
        if (pageId) qhseNavigate(pageId, { ...intent, source: 'dashboard_expert_pilotage' });
      });
      elDrill.append(btn);
    });
  }

  function updateHistory() {
    if (!elHistory) return;
    const ts = state.stats?.timeseries && typeof state.stats.timeseries === 'object' ? state.stats.timeseries : null;
    elHistory.replaceChildren();
    if (!ts) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;color:var(--text2,#94a3b8);font-size:12px';
      p.textContent = 'Historique indisponible (timeseries absent).';
      elHistory.append(p);
      return;
    }

    const inc = Array.isArray(ts.incidentsByMonth) ? ts.incidentsByMonth.map((x) => Number(x?.value) || 0) : [];
    const aud = Array.isArray(ts.auditsScoreByMonth) ? ts.auditsScoreByMonth.map((x) => Number(x?.value) || 0) : [];
    const nc = ts.nonConformitiesByMonth;
    const ncMaj = Array.isArray(nc?.major) ? nc.major : [];
    const ncMin = Array.isArray(nc?.minor) ? nc.minor : [];
    const ncSum = ncMaj.map((v, i) => (Number(v) || 0) + (Number(ncMin[i]) || 0));

    const items = [
      { label: 'Incidents', values: inc, stroke: 'rgba(239,68,68,.9)', fill: 'rgba(239,68,68,.12)' },
      { label: 'Score audits', values: aud, stroke: 'rgba(20,184,166,.9)', fill: 'rgba(20,184,166,.12)' },
      { label: 'NC (tot.)', values: ncSum, stroke: 'rgba(245,158,11,.95)', fill: 'rgba(245,158,11,.12)' }
    ];

    items.forEach((it) => {
      const box = document.createElement('div');
      box.style.cssText =
        'border:1px solid rgba(148,163,184,.10);border-radius:12px;padding:10px 10px 12px;background:rgba(255,255,255,.02)';
      box.innerHTML = `
        <div style="font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--text2,#94a3b8)">${escapeHtml(
          it.label
        )}</div>
        <div style="margin-top:6px">${mkSparkline(it.values, { stroke: it.stroke, fill: it.fill })}</div>
      `;
      elHistory.append(box);
    });
  }

  function updateAi(ai) {
    if (!elAiNarr || !elAiActs) return;
    const narrative = ai && typeof ai.narrative === 'string' ? ai.narrative.trim() : '';
    elAiNarr.textContent = narrative ? stripLongDashes(narrative).slice(0, 420) : 'Aucune recommandation IA chargée.';
    const acts = ai && Array.isArray(ai.actions) ? ai.actions : [];
    elAiActs.replaceChildren();
    acts.slice(0, 3).forEach((a) => {
      const li = document.createElement('li');
      li.textContent = stripLongDashes(`${a?.label || a?.title || 'Action'} - ${a?.reason || a?.description || ''}`)
        .trim()
        .slice(0, 260);
      elAiActs.append(li);
    });
  }

  async function loadCompliance() {
    if (complianceLoading) return;
    if (cachedCompliance) return;
    complianceLoading = true;
    if (complianceStatus) complianceStatus.textContent = 'Chargement…';
    try {
      const res = await qhseFetch('/api/compliance/pack?country=CI&standards=iso-45001&sector=mining');
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (complianceStatus) complianceStatus.textContent = String(j?.error || 'Impossible de charger la compliance.');
        return;
      }
      cachedCompliance = j;
      if (complianceDisclaimer) {
        complianceDisclaimer.textContent = String(j?.disclaimer || '').trim();
      }
      if (complianceStatus) complianceStatus.textContent = `Chargé: ${ensureList(j?.mergedRequirements).length} exigence(s).`;
      if (complianceHost) {
        complianceHost.style.display = 'block';
        const reqs = ensureList(j?.mergedRequirements).slice(0, 12);
        complianceHost.innerHTML = `
          <div style="display:grid;gap:10px">
            ${reqs
              .map((r) => {
                const ev = ensureList(r?.expectedEvidence);
                const ctrls = ensureList(r?.suggestedControls);
                const qs = computeAuditQuestions(r);
                return `
                  <div style="border:1px solid rgba(148,163,184,.10);border-radius:12px;padding:12px;background:rgba(0,0,0,.06)">
                    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:baseline">
                      <strong style="font-weight:900">${escapeHtml(String(r?.title || 'Exigence').slice(0, 140))}</strong>
                      <span class="badge blue">${escapeHtml(String(r?.priority || 'medium'))}</span>
                      <span style="font-size:11px;color:var(--text2,#94a3b8)">${escapeHtml(
                        String(r?.sourceLabel || r?.sourceType || 'indicatif').slice(0, 90)
                      )}</span>
                    </div>
                    <p style="margin:8px 0 0;font-size:12px;color:var(--text2,#94a3b8);line-height:1.4">${escapeHtml(
                      stripLongDashes(String(r?.summary || '')).slice(0, 360)
                    )}</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
                      <div>
                        <div class="section-kicker" style="opacity:.9">Preuves attendues</div>
                        <ul style="margin:8px 0 0;padding-left:16px;display:grid;gap:6px">
                          ${(ev.length ? ev : ['Non renseigné']).slice(0, 5).map((x) => `<li>${escapeHtml(String(x).slice(0, 120))}</li>`).join('')}
                        </ul>
                      </div>
                      <div>
                        <div class="section-kicker" style="opacity:.9">Contrôles suggérés</div>
                        <ul style="margin:8px 0 0;padding-left:16px;display:grid;gap:6px">
                          ${(ctrls.length ? ctrls : ['Non renseigné']).slice(0, 5).map((x) => `<li>${escapeHtml(String(x).slice(0, 120))}</li>`).join('')}
                        </ul>
                      </div>
                    </div>
                    <div style="margin-top:10px">
                      <div class="section-kicker" style="opacity:.9">Questions d’audit (générées)</div>
                      <ul style="margin:8px 0 0;padding-left:16px;display:grid;gap:6px">
                        ${qs.map((q) => `<li>${escapeHtml(q.slice(0, 160))}</li>`).join('')}
                      </ul>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }
    } catch {
      if (complianceStatus) complianceStatus.textContent = 'Erreur réseau (compliance).';
    } finally {
      complianceLoading = false;
    }
  }

  smiReloadBtn?.addEventListener('click', () => void loadSmiOverview(true));

  root.querySelector('[data-load-compliance]')?.addEventListener('click', () => void loadCompliance());
  root.querySelector('[data-open-iso]')?.addEventListener('click', () => qhseNavigate('iso', { source: 'dashboard_expert_compliance' }));
  root.querySelector('[data-export-premium]')?.addEventListener('click', () => {
    void (async () => {
      try {
        const { downloadIso45001PilotagePremiumPdf } = await import('../services/qhseReportsPdf.service.js');
        await downloadIso45001PilotagePremiumPdf({});
      } catch (e) {
        console.warn('[dashboard expert] export premium pdf', e);
      }
    })();
  });

  complianceDetails?.addEventListener('toggle', () => {
    const open = /** @type {HTMLDetailsElement} */ (complianceDetails).open;
    if (open && !cachedCompliance) void loadCompliance();
  });

  async function refreshHabAlerts() {
    try {
      const res = await qhseFetch('/api/habilitations/alerts?daysAhead=30&limit=30');
      if (!res.ok) return { expired: 0, expiring: 0 };
      const j = await res.json().catch(() => ({}));
      const rows = ensureList(j?.alerts);
      return {
        expired: rows.filter((a) => String(a?.type || '').includes('expired')).length,
        expiring: rows.filter((a) => String(a?.type || '').includes('expiring')).length
      };
    } catch {
      return { expired: 0, expiring: 0 };
    }
  }

  return {
    root,
    /**
     * @param {{ snap: any; stats: any; ncs: any[]; audits: any[]; incidents: any[] }} input
     */
    updateFromBackendPilotage(input) {
      state.pilotage = input?.pilotage || null;
      state.stats = input?.stats || null;
      updateScoreAndReasons();
      updateDrillDown();
      updateHistory();
      void loadSmiOverview(false);
    },
    updateAi,
    async refreshHabilitations() {
      state.hab = await refreshHabAlerts();
      updateScoreAndReasons();
    }
  };
}


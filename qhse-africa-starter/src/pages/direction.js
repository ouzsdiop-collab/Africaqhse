import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { showToast } from '../components/toast.js';
import { appState } from '../utils/state.js';

function fmtPct(v) {
  return v == null ? 'Non disponible' : `${v} %`;
}

function fmtDelta(deltaPct, isQuarter = false) {
  if (deltaPct == null) return 'Non disponible';
  const arrow = deltaPct > 0 ? '↑' : deltaPct < 0 ? '↓' : '→';
  const vsLabel = isQuarter ? 'vs trimestre précédent' : 'vs mois précédent';
  return `${arrow} ${deltaPct >= 0 ? '+' : ''}${deltaPct} % ${vsLabel}`;
}

function toneForDelta(deltaPct, lowerIsBetter = true) {
  if (deltaPct == null) return 'blue';
  if (lowerIsBetter) return deltaPct > 0 ? 'red' : deltaPct < 0 ? 'green' : 'blue';
  return deltaPct < 0 ? 'red' : deltaPct > 0 ? 'green' : 'blue';
}

function elKpiCard(title, valueText, deltaPct, lowerIsBetter, isQuarter = false) {
  const tone = toneForDelta(deltaPct, lowerIsBetter);
  const art = document.createElement('article');
  art.className = `metric-card card-soft direction-kpi-card direction-kpi-card--${tone}`;
  const lbl = document.createElement('div');
  lbl.className = 'metric-label';
  lbl.textContent = title;
  const val = document.createElement('div');
  val.className = `metric-value ${tone}`;
  val.textContent = valueText;
  const delta = document.createElement('div');
  delta.className = 'direction-kpi-delta';
  delta.textContent = fmtDelta(deltaPct, isQuarter);
  art.append(lbl, val, delta);
  return art;
}

function elAiSummaryCard(aiSummary) {
  const card = document.createElement('section');
  card.className = 'content-card card-soft direction-ai-card';
  const head = document.createElement('div');
  head.className = 'content-card-head';
  const h2 = document.createElement('h2');
  h2.className = 'direction-h2';
  h2.textContent = aiSummary?.source === 'ai' ? 'Synthèse IA — à valider' : 'Synthèse — à valider';
  head.append(h2);
  const p = document.createElement('p');
  p.className = 'direction-ai-text';
  p.textContent = aiSummary?.summary || 'Non disponible';
  const note = document.createElement('p');
  note.className = 'direction-ai-note';
  note.textContent =
    aiSummary?.source === 'ai'
      ? 'Généré par IA à partir des indicateurs chiffrés. À relire avant diffusion en réunion.'
      : 'Synthèse générée automatiquement à partir des indicateurs (mode sans IA externe).';
  card.append(head, p, note);
  return card;
}

function fmtValidatedAt(iso) {
  if (!iso) return 'Non disponible';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function elValidationCard(validations, onValidate) {
  const card = document.createElement('section');
  card.className = 'content-card card-soft direction-validation-card';
  const h2 = document.createElement('h2');
  h2.className = 'direction-h2';
  h2.textContent = 'Validation de la synthèse';
  card.append(h2);

  const last = Array.isArray(validations) && validations.length > 0 ? validations[0] : null;
  const status = document.createElement('p');
  status.className = 'direction-muted direction-validation-status';
  status.textContent = last
    ? `Dernière validation : par ${last.validatedBy} le ${fmtValidatedAt(last.validatedAt)}.`
    : 'Aucune validation enregistrée pour cette période.';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary';
  btn.textContent = 'Valider cette synthèse';
  btn.addEventListener('click', () => onValidate(btn, status));

  card.append(status, btn);
  return card;
}

function elValidationHistoryCard(validations) {
  const card = document.createElement('section');
  card.className = 'content-card card-soft';
  const h2 = document.createElement('h2');
  h2.className = 'direction-h2';
  h2.textContent = 'Historique des synthèses validées';
  card.append(h2);

  const list = Array.isArray(validations) ? validations : [];
  if (list.length === 0) {
    const p = document.createElement('p');
    p.className = 'direction-muted';
    p.textContent = 'Aucune synthèse validée pour cette période.';
    card.append(p);
    return card;
  }

  const table = document.createElement('table');
  table.className = 'data-table direction-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Date</th><th>Validée par</th><th>Synthèse</th></tr>';
  const tbody = document.createElement('tbody');
  list.forEach((v) => {
    const tr = document.createElement('tr');
    const dateTd = document.createElement('td');
    dateTd.textContent = fmtValidatedAt(v.validatedAt);
    const byTd = document.createElement('td');
    byTd.textContent = v.validatedBy || 'Non disponible';
    const summaryTd = document.createElement('td');
    summaryTd.textContent = v.summary || 'Non disponible';
    tr.append(dateTd, byTd, summaryTd);
    tbody.append(tr);
  });
  table.append(thead, tbody);
  card.append(table);
  return card;
}

function elTrendsChart(trends, isQuarter = false) {
  const card = document.createElement('section');
  card.className = 'content-card card-soft';
  const h2 = document.createElement('h2');
  h2.className = 'direction-h2';
  h2.textContent = isQuarter ? 'Tendances du trimestre (vs trimestre précédent)' : 'Tendances du mois (vs mois précédent)';
  card.append(h2);

  const metrics = [
    { key: 'incidentsCreated', label: 'Incidents créés', unit: '' },
    { key: 'actionsOverdueStock', label: 'Actions en retard', unit: '' },
    { key: 'nonConformitiesCreated', label: 'NC créées', unit: '' },
    { key: 'auditScoreAvg', label: 'Score audit moyen', unit: '%' }
  ];

  const grid = document.createElement('div');
  grid.className = 'direction-trend-grid';

  metrics.forEach(({ key, label, unit }) => {
    const t = trends?.[key];
    const current = Number.isFinite(t?.current) ? t.current : 0;
    const previous = Number.isFinite(t?.previous) ? t.previous : 0;
    const max = Math.max(current, previous, 1);

    const box = document.createElement('div');
    box.className = 'direction-trend-box';

    const title = document.createElement('div');
    title.className = 'direction-trend-box-label';
    title.textContent = label;

    const bars = document.createElement('div');
    bars.className = 'direction-trend-bars';
    bars.setAttribute('role', 'img');
    bars.setAttribute(
      'aria-label',
      `${label} : ${previous}${unit} le mois précédent, ${current}${unit} ce mois.`
    );

    const prevBar = document.createElement('div');
    prevBar.className = 'direction-trend-bar direction-trend-bar--previous';
    prevBar.style.setProperty('--bar-h', `${Math.round((previous / max) * 100)}%`);
    const prevVal = document.createElement('span');
    prevVal.className = 'direction-trend-bar-val';
    prevVal.textContent = `${previous}${unit}`;
    prevBar.append(prevVal);

    const curBar = document.createElement('div');
    curBar.className = 'direction-trend-bar direction-trend-bar--current';
    curBar.style.setProperty('--bar-h', `${Math.round((current / max) * 100)}%`);
    const curVal = document.createElement('span');
    curVal.className = 'direction-trend-bar-val';
    curVal.textContent = `${current}${unit}`;
    curBar.append(curVal);

    bars.append(prevBar, curBar);

    const legend = document.createElement('div');
    legend.className = 'direction-trend-legend';
    const prevLabel = isQuarter ? 'Trim. préc.' : 'Mois préc.';
    const curLabel = isQuarter ? 'Ce trimestre' : 'Ce mois';
    legend.innerHTML = `<span><i class="direction-trend-swatch direction-trend-swatch--previous"></i>${prevLabel}</span><span><i class="direction-trend-swatch direction-trend-swatch--current"></i>${curLabel}</span>`;

    box.append(title, bars, legend);
    grid.append(box);
  });

  card.append(grid);
  return card;
}

function elRisksChart(topRisks) {
  const card = document.createElement('section');
  card.className = 'content-card card-soft';
  const h2 = document.createElement('h2');
  h2.className = 'direction-h2';
  h2.textContent = 'Classement des risques par score';
  card.append(h2);

  const risks = Array.isArray(topRisks) ? topRisks : [];
  if (!risks.length) {
    const p = document.createElement('p');
    p.className = 'direction-muted';
    p.textContent = 'Aucun risque non maîtrisé identifié.';
    card.append(p);
    return card;
  }

  const max = Math.max(...risks.map((r) => Number(r.computedScore) || 0), 1);
  const list = document.createElement('div');
  list.className = 'direction-risk-chart';

  risks.forEach((r) => {
    const score = Number(r.computedScore) || 0;
    const row = document.createElement('div');
    row.className = 'direction-risk-row';

    const label = document.createElement('div');
    label.className = 'direction-risk-row-label';
    label.textContent = `${r.ref || ''} — ${r.title || ''}`;

    const track = document.createElement('div');
    track.className = 'direction-risk-row-track';
    track.setAttribute('role', 'img');
    track.setAttribute('aria-label', `Score ${score} pour ${r.title || r.ref || 'risque'}.`);
    const bar = document.createElement('div');
    bar.className = 'direction-risk-row-bar';
    bar.style.width = `${Math.round((score / max) * 100)}%`;
    const val = document.createElement('span');
    val.className = 'direction-risk-row-val';
    val.textContent = String(score);
    bar.append(val);
    track.append(bar);

    row.append(label, track);
    list.append(row);
  });

  card.append(list);
  return card;
}

function elRisksTable(topRisks) {
  const card = document.createElement('section');
  card.className = 'content-card card-soft';
  const h2 = document.createElement('h2');
  h2.className = 'direction-h2';
  h2.textContent = 'Top risques non maîtrisés';
  card.append(h2);
  if (!Array.isArray(topRisks) || topRisks.length === 0) {
    const p = document.createElement('p');
    p.className = 'direction-muted';
    p.textContent = 'Aucun risque non maîtrisé identifié.';
    card.append(p);
    return card;
  }
  const table = document.createElement('table');
  table.className = 'data-table direction-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Réf.</th><th>Titre</th><th>Catégorie</th><th>Score</th><th>Pilote</th></tr>';
  const tbody = document.createElement('tbody');
  topRisks.forEach((r) => {
    const tr = document.createElement('tr');
    [r.ref || '', r.title || '', r.category || '', r.computedScore ?? '', r.owner || 'Non disponible'].forEach(
      (v) => {
        const td = document.createElement('td');
        td.textContent = String(v);
        tr.append(td);
      }
    );
    tbody.append(tr);
  });
  table.append(thead, tbody);
  card.append(table);
  return card;
}

function elDeadlinesTable(deadlines) {
  const card = document.createElement('section');
  card.className = 'content-card card-soft';
  const h2 = document.createElement('h2');
  h2.className = 'direction-h2';
  h2.textContent = "Échéances d'habilitation (60 jours)";
  card.append(h2);
  if (!Array.isArray(deadlines) || deadlines.length === 0) {
    const p = document.createElement('p');
    p.className = 'direction-muted';
    p.textContent = 'Aucune échéance dans les 60 prochains jours.';
    card.append(p);
    return card;
  }
  const table = document.createElement('table');
  table.className = 'data-table direction-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Titulaire</th><th>Type</th><th>Niveau</th><th>Échéance</th></tr>';
  const tbody = document.createElement('tbody');
  deadlines.forEach((d) => {
    const tr = document.createElement('tr');
    const validUntil = d.validUntil ? new Date(d.validUntil).toLocaleDateString('fr-FR') : 'Non disponible';
    [d.holder || 'Non disponible', d.type || '', d.level || '', validUntil].forEach((v) => {
      const td = document.createElement('td');
      td.textContent = String(v);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(thead, tbody);
  card.append(table);
  return card;
}

function elAlertsCard(alerts) {
  const card = document.createElement('section');
  card.className = 'content-card card-soft';
  const h2 = document.createElement('h2');
  h2.className = 'direction-h2';
  h2.textContent = 'Alertes prioritaires';
  card.append(h2);
  if (!Array.isArray(alerts) || alerts.length === 0) {
    const p = document.createElement('p');
    p.className = 'direction-muted';
    p.textContent = 'Aucune alerte.';
    card.append(p);
    return card;
  }
  const ul = document.createElement('ul');
  ul.className = 'direction-alerts-list';
  alerts.slice(0, 8).forEach((a) => {
    const li = document.createElement('li');
    const level = a.level === 'critical' ? 'critical' : a.level === 'high' ? 'high' : 'info';
    li.className = `direction-alert direction-alert--${level}`;
    li.textContent = a.message || a.code || 'Non disponible';
    ul.append(li);
  });
  card.append(ul);
  return card;
}

export function renderDirection() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas direction-page';

  const header = document.createElement('header');
  header.className = 'direction-header';
  const titleWrap = document.createElement('div');
  const title = document.createElement('h1');
  title.textContent = 'Synthèse direction';
  const sub = document.createElement('p');
  sub.className = 'direction-muted';
  sub.textContent = 'Indicateurs du mois, tendances, risques et échéances — pour préparer les réunions de direction.';
  const scope = document.createElement('p');
  scope.className = 'direction-muted direction-scope';
  scope.textContent = `Périmètre : ${appState.currentSite}`;
  titleWrap.append(title, sub, scope);

  const periodSelect = document.createElement('select');
  periodSelect.className = 'direction-period-select';
  periodSelect.setAttribute('aria-label', 'Période de la synthèse');
  [
    { value: 'month', label: 'Mensuel' },
    { value: 'quarter', label: 'Trimestriel' }
  ].forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    periodSelect.append(opt);
  });

  const pdfBtn = document.createElement('button');
  pdfBtn.type = 'button';
  pdfBtn.className = 'btn btn-secondary';
  pdfBtn.textContent = 'Exporter en PDF';
  pdfBtn.disabled = true;

  const headerActions = document.createElement('div');
  headerActions.className = 'direction-header-actions';
  headerActions.append(periodSelect, pdfBtn);

  header.append(titleWrap, headerActions);

  const loading = document.createElement('p');
  loading.className = 'direction-muted';
  loading.textContent = 'Chargement…';

  const content = document.createElement('div');
  content.className = 'direction-content stack';
  content.append(loading);

  page.append(header, content);

  /** @type {Record<string, unknown> | null} */
  let lastData = null;

  pdfBtn.addEventListener('click', async () => {
    if (!lastData) {
      showToast('Chargez d’abord les données.', 'warning');
      return;
    }
    try {
      const { downloadDirectionSummaryPdf } = await import('../services/qhseReportsPdf.service.js');
      await downloadDirectionSummaryPdf(lastData);
    } catch (e) {
      console.error('[direction] export pdf', e);
      showToast('Erreur export PDF', 'error');
    }
  });

  async function load(period) {
    pdfBtn.disabled = true;
    content.replaceChildren();
    const loadingEl = document.createElement('p');
    loadingEl.className = 'direction-muted';
    loadingEl.textContent = 'Chargement…';
    content.append(loadingEl);

    try {
      const res = await qhseFetch(withSiteQuery(`/api/reports/direction?period=${encodeURIComponent(period)}`));
      if (res.status === 403) {
        content.replaceChildren();
        const p = document.createElement('p');
        p.className = 'direction-muted';
        p.textContent = 'Permission « rapports » requise pour la synthèse direction.';
        content.append(p);
        showToast('Accès synthèse direction refusé', 'error');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      lastData = data;
      pdfBtn.disabled = false;

      let validations = [];
      try {
        const valRes = await qhseFetch(
          withSiteQuery(`/api/reports/direction/validations?period=${encodeURIComponent(period)}`)
        );
        if (valRes.ok) {
          const valData = await valRes.json();
          validations = Array.isArray(valData.validations) ? valData.validations : [];
        }
      } catch (e) {
        console.error('[direction] validations', e);
      }

      const isQuarter = data.period === 'quarter';
      const trends = data.trends || {};
      const counts = data.counts || {};
      const kpis = data.kpis || {};

      const kpiGrid = document.createElement('div');
      kpiGrid.className = 'kpi-grid direction-kpi-grid';
      kpiGrid.append(
        elKpiCard(
          isQuarter ? 'Incidents ce trimestre' : 'Incidents ce mois',
          String(trends.incidentsCreated?.current ?? 0),
          trends.incidentsCreated?.deltaPct,
          true,
          isQuarter
        ),
        elKpiCard('Score audit moyen', fmtPct(kpis.auditScoreAvg), trends.auditScoreAvg?.deltaPct, false, isQuarter),
        elKpiCard('Actions en retard', String(trends.actionsOverdueStock?.current ?? 0), trends.actionsOverdueStock?.deltaPct, true, isQuarter),
        elKpiCard(
          isQuarter ? 'NC créées ce trimestre' : 'NC créées ce mois',
          String(trends.nonConformitiesCreated?.current ?? 0),
          trends.nonConformitiesCreated?.deltaPct,
          true,
          isQuarter
        )
      );

      const secondaryGrid = document.createElement('div');
      secondaryGrid.className = 'kpi-grid direction-secondary-grid';
      secondaryGrid.append(
        elKpiCard('Incidents critiques ouverts', String(counts.incidentsCriticalOpen ?? 0), null, true),
        elKpiCard('NC ouvertes', String(counts.nonConformitiesOpen ?? 0), null, true)
      );

      const handleValidate = async (btn, status) => {
        btn.disabled = true;
        try {
          const valRes = await qhseFetch(
            withSiteQuery(`/api/reports/direction/validate?period=${encodeURIComponent(period)}`),
            { method: 'POST' }
          );
          if (!valRes.ok) throw new Error(`HTTP ${valRes.status}`);
          await valRes.json();
          showToast('Synthèse validée', 'success');
          await load(period);
          return;
        } catch (e) {
          console.error('[direction] validate', e);
          showToast('Erreur lors de la validation', 'error');
        } finally {
          btn.disabled = false;
        }
      };

      content.replaceChildren(
        elAiSummaryCard(data.aiSummary),
        elValidationCard(validations, handleValidate),
        elValidationHistoryCard(validations),
        kpiGrid,
        secondaryGrid,
        elTrendsChart(trends, isQuarter),
        elRisksChart(data.topRisks),
        elRisksTable(data.topRisks),
        elDeadlinesTable(data.upcomingDeadlines),
        elAlertsCard(data.priorityAlerts)
      );
    } catch (err) {
      console.error('[direction]', err);
      content.replaceChildren();
      const p = document.createElement('p');
      p.className = 'direction-muted';
      p.textContent = 'Impossible de charger la synthèse direction.';
      content.append(p);
      showToast('Erreur chargement synthèse direction', 'error');
    }
  }

  periodSelect.addEventListener('change', () => {
    load(periodSelect.value);
  });

  load(periodSelect.value);

  return page;
}

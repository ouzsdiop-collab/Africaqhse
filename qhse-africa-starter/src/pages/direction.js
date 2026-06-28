import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { showToast } from '../components/toast.js';

function fmtPct(v) {
  return v == null ? 'Non disponible' : `${v} %`;
}

function fmtDelta(deltaPct) {
  if (deltaPct == null) return 'Non disponible';
  const arrow = deltaPct > 0 ? '↑' : deltaPct < 0 ? '↓' : '→';
  return `${arrow} ${deltaPct >= 0 ? '+' : ''}${deltaPct} % vs mois précédent`;
}

function toneForDelta(deltaPct, lowerIsBetter = true) {
  if (deltaPct == null) return 'blue';
  if (lowerIsBetter) return deltaPct > 0 ? 'red' : deltaPct < 0 ? 'green' : 'blue';
  return deltaPct < 0 ? 'red' : deltaPct > 0 ? 'green' : 'blue';
}

function elKpiCard(title, valueText, deltaPct, lowerIsBetter) {
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
  delta.textContent = fmtDelta(deltaPct);
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
  titleWrap.append(title, sub);

  const pdfBtn = document.createElement('button');
  pdfBtn.type = 'button';
  pdfBtn.className = 'btn btn-secondary';
  pdfBtn.textContent = 'Exporter en PDF';
  pdfBtn.disabled = true;

  header.append(titleWrap, pdfBtn);

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

  (async function load() {
    try {
      const res = await qhseFetch(withSiteQuery('/api/reports/direction'));
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

      const trends = data.trends || {};
      const counts = data.counts || {};
      const kpis = data.kpis || {};

      const kpiGrid = document.createElement('div');
      kpiGrid.className = 'kpi-grid direction-kpi-grid';
      kpiGrid.append(
        elKpiCard('Incidents ce mois', String(trends.incidentsCreated?.current ?? 0), trends.incidentsCreated?.deltaPct, true),
        elKpiCard('Score audit moyen', fmtPct(kpis.auditScoreAvg), trends.auditScoreAvg?.deltaPct, false),
        elKpiCard('Actions en retard', String(trends.actionsOverdueStock?.current ?? 0), trends.actionsOverdueStock?.deltaPct, true),
        elKpiCard('NC créées ce mois', String(trends.nonConformitiesCreated?.current ?? 0), trends.nonConformitiesCreated?.deltaPct, true)
      );

      const secondaryGrid = document.createElement('div');
      secondaryGrid.className = 'kpi-grid direction-secondary-grid';
      secondaryGrid.append(
        elKpiCard('Incidents critiques ouverts', String(counts.incidentsCriticalOpen ?? 0), null, true),
        elKpiCard('NC ouvertes', String(counts.nonConformitiesOpen ?? 0), null, true)
      );

      content.replaceChildren(
        elAiSummaryCard(data.aiSummary),
        kpiGrid,
        secondaryGrid,
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
  })();

  return page;
}

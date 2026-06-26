import { qhseFetch } from '../utils/qhseFetch.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../utils/designSystem.js';
import {
  createEnvironmentalMonthlyTrendChart,
  createEnvironmentalTypeBreakdownChart
} from '../components/environmentalCharts.js';

const TYPE_LABELS = {
  waste: 'Déchets',
  water: 'Eau',
  energy: 'Énergie'
};

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
}

const TREND_WINDOW_DAYS = 30;

function isoDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchEnvironmentalSummary(params) {
  try {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await qhseFetch(`/api/environmental/summary${qs}`);
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    return Array.isArray(body?.summary) ? body.summary : [];
  } catch {
    return null;
  }
}

/**
 * Compare la fenêtre des N derniers jours à la fenêtre précédente, par type.
 * @param {{ totalQuantity?: number }[] | null} current
 * @param {{ totalQuantity?: number }[] | null} previous
 * @param {string} type
 */
function buildTrendLine(current, previous, type) {
  const c = current?.find((s) => s.type === type)?.totalQuantity ?? 0;
  const p = previous?.find((s) => s.type === type)?.totalQuantity ?? 0;
  if (p > 0) {
    const pct = Math.round(((c - p) / p) * 100);
    const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '→';
    const sign = pct > 0 ? '+' : '';
    return {
      text: `${arrow} ${sign}${pct} % vs ${TREND_WINDOW_DAYS} j précédents`,
      tone: pct > 0 ? 'risk' : pct < 0 ? 'ok' : 'flat'
    };
  }
  if (c > 0) {
    return { text: `Nouveau sur ${TREND_WINDOW_DAYS} j (pas de référence)`, tone: 'flat' };
  }
  return null;
}

export function renderEnvironmental() {
  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas environmental-page';

  const su = getSessionUser();
  const canRead = canResource(su?.role, 'environmental', 'read');
  const canWrite = canResource(su?.role, 'environmental', 'write');

  page.innerHTML = `
    <article class="content-card card-soft environmental-summary-card">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Synthèse</div>
          <h3>Totaux par type</h3>
        </div>
      </div>
      <div class="environmental-summary-host stack" style="margin-top:12px"></div>
    </article>

    <article class="content-card card-soft environmental-charts-card">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Graphiques</div>
          <h3>Tendance &amp; répartition</h3>
        </div>
      </div>
      <div class="environmental-charts-grid" style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-top:12px">
        <div class="environmental-trend-chart-host" style="position:relative;height:260px"></div>
        <div class="environmental-breakdown-chart-host" style="position:relative;height:260px"></div>
      </div>
    </article>

    <article class="content-card card-soft">
      <div class="content-card-head">
        <div>
          <div class="section-kicker">Relevés</div>
          <h3>Déchets / Eau / Énergie</h3>
        </div>
      </div>
      <div class="environmental-list-host stack" style="margin-top:12px"></div>
      <div class="form-grid" style="gap:12px;margin-top:16px">
        <label class="field">
          <span>Type <span style="color:var(--text3)">(obligatoire)</span></span>
          <select class="control-input env-type">
            <option value="waste">Déchets</option>
            <option value="water">Eau</option>
            <option value="energy">Énergie</option>
          </select>
        </label>
        <label class="field">
          <span>Catégorie</span>
          <input type="text" class="control-input env-category" maxlength="200" placeholder="Déchets dangereux, électricité…" />
        </label>
        <label class="field">
          <span>Quantité <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="number" step="any" class="control-input env-quantity" />
        </label>
        <label class="field">
          <span>Unité <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="text" class="control-input env-unit" maxlength="50" placeholder="kg, m3, kWh…" />
        </label>
        <label class="field">
          <span>Date de relevé <span style="color:var(--text3)">(obligatoire)</span></span>
          <input type="date" class="control-input env-period" />
        </label>
        <label class="field field-full">
          <span>Notes</span>
          <input type="text" class="control-input env-notes" maxlength="500" />
        </label>
        <button type="button" class="btn btn-primary env-btn-create field-full" style="min-height:48px;font-weight:700">
          Ajouter le relevé
        </button>
      </div>
    </article>
  `;

  const summaryHost = page.querySelector('.environmental-summary-host');
  const listHost = page.querySelector('.environmental-list-host');
  const trendChartHost = page.querySelector('.environmental-trend-chart-host');
  const breakdownChartHost = page.querySelector('.environmental-breakdown-chart-host');
  let trendChart = null;
  let breakdownChart = null;

  const typeSel = page.querySelector('.env-type');
  const categoryIn = page.querySelector('.env-category');
  const quantityIn = page.querySelector('.env-quantity');
  const unitIn = page.querySelector('.env-unit');
  const periodIn = page.querySelector('.env-period');
  const notesIn = page.querySelector('.env-notes');
  const createBtn = page.querySelector('.env-btn-create');

  if (!canRead && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
    summaryHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Lecture du suivi environnemental non autorisée pour ce rôle.</p>';
    listHost.innerHTML = '';
    return page;
  }

  if (!canWrite && su) {
    page.querySelectorAll('.form-grid input, .form-grid select, .form-grid button').forEach((el) => {
      el.disabled = true;
    });
  }

  function renderCharts(list, summary) {
    if (trendChart) {
      trendChart.destroy();
      trendChart = null;
    }
    if (breakdownChart) {
      breakdownChart.destroy();
      breakdownChart = null;
    }
    trendChartHost.innerHTML = '';
    breakdownChartHost.innerHTML = '';

    if (Array.isArray(list) && list.length > 0) {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-label', 'Tendance mensuelle des relevés environnementaux par type');
      canvas.setAttribute('role', 'img');
      trendChartHost.append(canvas);
      trendChart = createEnvironmentalMonthlyTrendChart(canvas, list);
    } else {
      trendChartHost.append(createEmptyState('📈', 'Pas de données', 'Ajoutez des relevés pour voir la tendance mensuelle.'));
    }

    if (Array.isArray(summary) && summary.length > 0) {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-label', 'Répartition des relevés environnementaux par type');
      canvas.setAttribute('role', 'img');
      breakdownChartHost.append(canvas);
      breakdownChart = createEnvironmentalTypeBreakdownChart(canvas, summary);
    } else {
      breakdownChartHost.append(createEmptyState('🥧', 'Pas de données', 'Ajoutez des relevés pour voir la répartition.'));
    }
  }

  async function refreshCharts() {
    try {
      const [summary, res] = await Promise.all([fetchEnvironmentalSummary(), qhseFetch('/api/environmental')]);
      const list = res?.ok ? await res.json().catch(() => []) : [];
      renderCharts(Array.isArray(list) ? list : [], summary || []);
    } catch {
      renderCharts([], []);
    }
  }

  async function refreshSummary() {
    summaryHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const now = new Date();
      const curStart = new Date(now.getTime() - TREND_WINDOW_DAYS * 86400000);
      const prevStart = new Date(now.getTime() - 2 * TREND_WINDOW_DAYS * 86400000);
      const prevEnd = new Date(curStart.getTime() - 86400000);

      const [summary, currentWindow, previousWindow] = await Promise.all([
        fetchEnvironmentalSummary(),
        fetchEnvironmentalSummary({ from: isoDateOnly(curStart), to: isoDateOnly(now) }),
        fetchEnvironmentalSummary({ from: isoDateOnly(prevStart), to: isoDateOnly(prevEnd) })
      ]);
      if (summary == null) throw new Error('summary unavailable');
      if (summary.length === 0) {
        summaryHost.replaceChildren();
        summaryHost.append(createEmptyState('🌍', 'Aucun relevé', 'Ajoutez un relevé pour voir apparaître la synthèse.'));
        return;
      }
      summaryHost.replaceChildren();
      summary.forEach((s) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = TYPE_LABELS[s.type] || s.type;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        sub.textContent = `${s.totalQuantity} ${s.unit} · ${s.recordCount} relevé(s)`;
        left.append(title, sub);
        const trend = buildTrendLine(currentWindow, previousWindow, s.type);
        if (trend) {
          const trendEl = document.createElement('p');
          trendEl.style.margin = '4px 0 0';
          trendEl.style.fontSize = '12px';
          trendEl.style.fontWeight = '600';
          trendEl.style.color =
            trend.tone === 'risk' ? 'var(--danger, #e25555)' : trend.tone === 'ok' ? 'var(--success, #2e7d32)' : 'var(--text2)';
          trendEl.textContent = trend.text;
          left.append(trendEl);
        }
        row.append(left);
        summaryHost.append(row);
      });
    } catch {
      summaryHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Synthèse indisponible : vérifiez l’API.</p>';
    }
  }

  async function refreshList() {
    listHost.innerHTML = '<p style="margin:0;font-size:13px;color:var(--text2)">Chargement…</p>';
    try {
      const res = await qhseFetch('/api/environmental');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];
      if (list.length === 0) {
        listHost.replaceChildren();
        listHost.append(createEmptyState('🌍', 'Aucun relevé', 'Ajoutez le premier relevé ci-dessous.'));
        return;
      }
      listHost.replaceChildren();
      list.forEach((rec) => {
        const row = document.createElement('article');
        row.className = 'list-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'flex-start';
        row.style.gap = '12px';
        const left = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = `${TYPE_LABELS[rec.type] || rec.type} — ${rec.quantity} ${rec.unit}`;
        const sub = document.createElement('p');
        sub.style.margin = '6px 0 0';
        sub.style.fontSize = '12px';
        sub.style.color = 'var(--text2)';
        const parts = [fmtDate(rec.periodDate)];
        if (rec.category) parts.push(rec.category);
        if (rec.siteRecord?.name) parts.push(rec.siteRecord.name);
        sub.textContent = parts.filter(Boolean).join(' · ');
        left.append(title, sub);
        row.append(left);
        if (canWrite) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'btn btn-ghost';
          delBtn.textContent = 'Supprimer';
          delBtn.addEventListener('click', async () => {
            if (!window.confirm('Supprimer ce relevé ?')) return;
            try {
              const r = await qhseFetch(`/api/environmental/${encodeURIComponent(rec.id)}`, { method: 'DELETE' });
              if (!r.ok && r.status !== 204) throw new Error('delete failed');
              showToast('Relevé supprimé', 'info');
              await refreshList();
              await refreshSummary();
              await refreshCharts();
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
    const type = typeSel.value;
    const quantity = quantityIn.value !== '' ? Number(quantityIn.value) : NaN;
    const unit = (unitIn.value || '').trim();
    const periodDate = periodIn.value ? new Date(periodIn.value).toISOString() : '';
    if (!type || !Number.isFinite(quantity) || !unit || !periodDate) {
      showToast('Type, quantité, unité et date requis', 'error');
      return;
    }
    const category = (categoryIn.value || '').trim() || undefined;
    const notes = (notesIn.value || '').trim() || undefined;
    createBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/environmental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, category, quantity, unit, periodDate, notes })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof body.error === 'string' ? body.error : 'Erreur création', 'error');
        return;
      }
      showToast('Relevé créé', 'info');
      categoryIn.value = '';
      quantityIn.value = '';
      unitIn.value = '';
      periodIn.value = '';
      notesIn.value = '';
      await refreshList();
      await refreshSummary();
      await refreshCharts();
    } catch {
      showToast('Erreur serveur', 'error');
    } finally {
      createBtn.disabled = false;
    }
  });

  refreshSummary();
  refreshList();
  refreshCharts();

  const firstCard = page.querySelector('article');
  if (firstCard) firstCard.id = 'environmental-page-anchor';
  return page;
}

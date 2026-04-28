/** Histogramme incidents : hauteurs via variable CSS (--bar-h). */
const SERIES = [
  { label: 'Jan', h: 36 },
  { label: 'Fév', h: 52 },
  { label: 'Mar', h: 44 },
  { label: 'Avr', h: 68 },
  { label: 'Mai', h: 72 },
  { label: 'Juin', h: 58 }
];

export function createDashboardBarChart() {
  const box = document.createElement('div');
  box.className = 'dashboard-bar-chart-wrap';

  const axis = document.createElement('p');
  axis.className = 'dashboard-chart-axis';
  axis.textContent = 'Volume relatif (échelle interne)';

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-bar-chart--dashboard';
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', 'Histogramme des incidents sur six mois, tendance à la hausse en fin de période.');

  SERIES.forEach(({ label, h }) => {
    const bar = document.createElement('div');
    bar.className = 'dashboard-bar';
    bar.style.setProperty('--bar-h', `${h}%`);
    bar.setAttribute('role', 'presentation');
    const span = document.createElement('span');
    span.textContent = label;
    bar.append(span);
    wrap.append(bar);
  });

  const foot = document.createElement('p');
  foot.className = 'dashboard-chart-foot';
  foot.textContent =
    'Tendance : évolution sur la période affichée. À corréler avec l’activité site et la maintenance.';

  box.append(axis, wrap, foot);
  return box;
}

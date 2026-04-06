/**
 * Alertes prioritaires — incidents critiques, actions en retard, NC ouvertes.
 */

function createPriorityRows(items, variant) {
  const stack = document.createElement('div');
  stack.className = 'stack dashboard-priority-list';

  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = `list-row dashboard-priority-row dashboard-priority-row--${variant}`;

    const div1 = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = item.title;
    const p = document.createElement('p');
    p.textContent = item.detail;
    div1.append(strong, p);

    const div2 = document.createElement('div');
    div2.className = 'list-meta';
    const badge = document.createElement('span');
    badge.className = `badge ${item.tone}`;
    badge.textContent = item.status;
    const small = document.createElement('small');
    small.textContent = item.meta || '';
    div2.append(badge, small);

    row.append(div1, div2);
    stack.append(row);
  });

  return stack;
}

function heading(text, kind) {
  const h = document.createElement('h4');
  h.className = `dashboard-priority-heading dashboard-priority-heading--${kind}`;
  const dot = document.createElement('span');
  dot.className = 'dashboard-priority-dot';
  dot.setAttribute('aria-hidden', 'true');
  h.append(dot, document.createTextNode(text));
  return h;
}

/**
 * @param {{
 *   criticalIncidents: Array<{ title: string; detail: string; status: string; tone: string; meta?: string }>;
 *   overdueActions: Array<{ title: string; detail: string; status: string; tone: string; meta?: string }>;
 *   openNonConformities?: Array<{ title: string; detail: string; status: string; tone: string; meta?: string }>;
 * }} params
 */
export function createDashboardPriorityBlock({
  criticalIncidents,
  overdueActions,
  openNonConformities = []
}) {
  const root = document.createElement('div');
  root.className = 'dashboard-priority-stack';

  if (criticalIncidents.length) {
    const block = document.createElement('div');
    block.className = 'dashboard-priority-block';
    block.append(
      heading('Incidents critiques', 'incidents'),
      createPriorityRows(criticalIncidents, 'incident')
    );
    root.append(block);
  }

  if (overdueActions.length) {
    const block = document.createElement('div');
    block.className = 'dashboard-priority-block';
    block.append(
      heading('Actions en retard', 'actions'),
      createPriorityRows(overdueActions, 'action')
    );
    root.append(block);
  }

  if (openNonConformities.length) {
    const block = document.createElement('div');
    block.className = 'dashboard-priority-block';
    block.append(
      heading('Non-conformités à traiter', 'nc'),
      createPriorityRows(openNonConformities, 'nc')
    );
    root.append(block);
  }

  if (!root.children.length) {
    const p = document.createElement('p');
    p.className = 'dashboard-situation-note';
    p.textContent = 'Aucune alerte prioritaire sur ce périmètre.';
    root.append(p);
  }

  return root;
}

import { escapeHtml } from '../utils/escapeHtml.js';

export function createSectionHero(title, description, actions = []) {
  const hero = document.createElement('section');
  hero.className = 'hero card-soft';

  const actionsHtml = actions
    .map(
      (action) =>
        `<button type="button" class="${action.primary ? 'btn btn-primary' : 'btn'}">${escapeHtml(action.label)}</button>`
    )
    .join('');

  hero.innerHTML = `
    <div>
      <div class="section-kicker">Vision produit</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <div class="inline-actions">${actionsHtml}</div>
    </div>
  `;

  return hero;
}

export function createList(items) {
  const wrapper = document.createElement('div');
  wrapper.className = 'stack';
  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'list-row';
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.detail)}</p>
      </div>
      <div class="list-meta">
        <span class="badge ${escapeHtml(item.tone)}">${escapeHtml(item.status)}</span>
        <small>${escapeHtml(item.meta || '')}</small>
      </div>
    `;
    wrapper.append(row);
  });
  return wrapper;
}

export function createTable(headers, rows) {
  const shell = document.createElement('div');
  shell.className = 'table-shell card-soft';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  headers.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    trHead.append(th);
  });
  thead.append(trHead);
  table.append(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell) => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  shell.append(table);
  return shell;
}

import { qhseFetch } from '../utils/qhseFetch.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

/**
 * Affiche, dans `host`, les processus liés à un élément (risque, action, audit, document, incident...).
 * @param {HTMLElement} host
 * @param {string} linkedType
 * @param {string} linkedId
 */
export async function renderRelatedProcesses(host, linkedType, linkedId) {
  if (!host || !linkedType || !linkedId) return;
  host.replaceChildren();
  try {
    const res = await qhseFetch(`/api/processes/by-link?linkedType=${encodeURIComponent(linkedType)}&linkedId=${encodeURIComponent(linkedId)}`);
    if (!res.ok) return;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'related-processes';
    wrap.innerHTML = `<div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Processus concerné(s)</div>`;
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexWrap = 'wrap';
    list.style.gap = '6px';
    rows.forEach((p) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'btn btn-secondary';
      chip.style.padding = '2px 10px';
      chip.style.fontSize = '12px';
      chip.textContent = p.name || 'Processus';
      chip.title = p.owner?.name ? `Pilote : ${p.owner.name}` : '';
      chip.addEventListener('click', () => {
        qhseNavigate('processes', { source: 'related_process_chip', processId: p.id });
      });
      list.append(chip);
    });
    wrap.append(list);
    host.append(wrap);
  } catch (err) {
    console.error('[relatedProcesses]', err);
  }
}

import { getApiBase } from '../config.js';

function formatDue(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

/**
 * Dialogue lecture seule — détail action (API actuelle : pas de PATCH statut générique).
 */
export function createActionDetailDialog() {
  const dlg = document.createElement('dialog');
  dlg.className = 'action-detail-dialog';

  const inner = document.createElement('div');
  inner.className = 'action-detail-dialog__inner';

  inner.innerHTML = `
    <div class="action-detail-dialog__head">
      <h2 class="action-detail-dialog__title" data-ad-title></h2>
      <button type="button" class="btn btn-secondary action-detail-dialog__close" aria-label="Fermer">Fermer</button>
    </div>
    <div class="action-detail-dialog__badges" data-ad-badges></div>
    <dl class="action-detail-dialog__grid">
      <dt>Statut</dt><dd data-ad-status></dd>
      <dt>Responsable</dt><dd data-ad-owner></dd>
      <dt>Échéance</dt><dd data-ad-due></dd>
      <dt>Identifiant</dt><dd><code class="action-detail-dialog__id" data-ad-id></code></dd>
      <dt>API</dt><dd class="action-detail-dialog__api"><code data-ad-api></code></dd>
    </dl>
    <div class="action-detail-dialog__block">
      <div class="action-detail-dialog__block-label">Description / périmètre</div>
      <p class="action-detail-dialog__detail" data-ad-detail></p>
    </div>
    <div class="action-detail-dialog__foot">
      <button type="button" class="btn btn-secondary" data-ad-copy>Copier l’identifiant</button>
    </div>
  `;

  dlg.append(inner);
  document.body.append(dlg);

  function close() {
    dlg.close();
  }

  inner.querySelector('.action-detail-dialog__close').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  inner.querySelector('[data-ad-copy]').addEventListener('click', async () => {
    const id = inner.querySelector('[data-ad-id]')?.textContent?.trim() || '';
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      /* ignore */
    }
  });

  return {
    element: dlg,
    /**
     * @param {object} row — ligne API action
     * @param {string} [columnKey] — todo | doing | overdue | done
     */
    show(row, columnKey) {
      if (!row) return;
      const title = String(row.title || 'Action').trim() || 'Action';
      const status = String(row.status || '—').trim();
      const resp =
        row.assignee?.name != null && String(row.assignee.name).trim()
          ? String(row.assignee.name).trim()
          : String(row.owner || '—').trim();
      const due = formatDue(row.dueDate);
      const id = String(row.id || '');
      const detail =
        row.detail != null && String(row.detail).trim()
          ? String(row.detail).trim()
          : '—';

      inner.querySelector('[data-ad-title]').textContent = title;
      inner.querySelector('[data-ad-status]').textContent = status;
      inner.querySelector('[data-ad-owner]').textContent = resp;
      inner.querySelector('[data-ad-due]').textContent = due;
      inner.querySelector('[data-ad-id]').textContent = id;
      inner.querySelector('[data-ad-detail]').textContent = detail;
      inner.querySelector('[data-ad-api]').textContent = `${getApiBase()}/api/actions`;

      const badges = inner.querySelector('[data-ad-badges]');
      badges.replaceChildren();
      const col = columnKey || '';
      const addBadge = (text, mod) => {
        const s = document.createElement('span');
        s.className = `action-detail-dialog__pill ${mod || ''}`.trim();
        s.textContent = text;
        badges.append(s);
      };
      if (col === 'overdue') addBadge('Priorité : retard', 'action-detail-dialog__pill--danger');
      else if (col === 'doing') addBadge('En cours', 'action-detail-dialog__pill--warn');
      else if (col === 'todo') addBadge('À lancer', 'action-detail-dialog__pill--info');
      else if (col === 'done') addBadge('Terminé', 'action-detail-dialog__pill--ok');

      dlg.showModal();
    }
  };
}

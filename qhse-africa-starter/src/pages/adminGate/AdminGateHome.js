export function createAdminGateHomeView() {
  const root = document.createElement('main');
  root.className = 'admin-gate-root';

  const card = document.createElement('section');
  card.className = 'content-card card-soft admin-gate-card admin-gate-card--success';
  card.innerHTML = `
    <h1 class="admin-gate-title">Admin QHSE Control</h1>
    <p class="admin-gate-success">Admin QHSE Control déverrouillé</p>
  `;

  root.append(card);
  return root;
}

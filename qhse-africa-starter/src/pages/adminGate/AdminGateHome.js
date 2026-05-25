export function createAdminGateHomeView() {
  const root = document.createElement('main');
  root.style.minHeight = '100vh';
  root.style.display = 'grid';
  root.style.placeItems = 'center';
  root.style.background = 'radial-gradient(circle at top, #111827 0%, #020617 55%, #000 100%)';
  root.style.color = '#e2e8f0';

  const card = document.createElement('section');
  card.className = 'content-card card-soft';
  card.style.width = 'min(560px, calc(100vw - 2rem))';
  card.style.padding = '2rem';
  card.style.textAlign = 'center';
  card.innerHTML = `
    <h1 style="margin:0 0 .5rem;font-size:1.6rem;color:#f8fafc">Admin QHSE Control</h1>
    <p style="margin:0;color:#cbd5e1;font-size:1.05rem">Admin QHSE Control déverrouillé</p>
  `;

  root.append(card);
  return root;
}

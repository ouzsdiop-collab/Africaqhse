import { qhseFetch } from '../utils/qhseFetch.js';
import { showToast } from './toast.js';

let mounted = false;

function closeModal(overlay) {
  overlay.remove();
}

function openModal() {
  if (document.querySelector('.feedback-widget-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'feedback-widget-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Signaler un problème ou une suggestion');

  const panel = document.createElement('div');
  panel.className = 'feedback-widget-panel';

  const title = document.createElement('h2');
  title.className = 'feedback-widget-title';
  title.textContent = 'Votre avis compte';
  panel.append(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'feedback-widget-subtitle';
  subtitle.textContent = 'Bug rencontré, idée d’amélioration ? Dites-nous tout.';
  panel.append(subtitle);

  const typeWrap = document.createElement('div');
  typeWrap.className = 'feedback-widget-types';
  const types = [
    { value: 'bug', label: 'Bug' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'other', label: 'Autre' }
  ];
  let selectedType = 'suggestion';
  for (const t of types) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'feedback-widget-type' + (t.value === selectedType ? ' is-active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      selectedType = t.value;
      typeWrap.querySelectorAll('.feedback-widget-type').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
    typeWrap.append(btn);
  }
  panel.append(typeWrap);

  const textarea = document.createElement('textarea');
  textarea.className = 'feedback-widget-textarea';
  textarea.placeholder = 'Décrivez le problème ou votre idée…';
  textarea.rows = 5;
  panel.append(textarea);

  const actions = document.createElement('div');
  actions.className = 'feedback-widget-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn feedback-widget-cancel';
  cancelBtn.textContent = 'Annuler';
  cancelBtn.addEventListener('click', () => closeModal(overlay));

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'btn btn-primary feedback-widget-submit';
  submitBtn.textContent = 'Envoyer';
  submitBtn.addEventListener('click', async () => {
    const message = textarea.value.trim();
    if (!message) {
      showToast('Merci de décrire votre retour avant d’envoyer.', 'warning');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';
    try {
      const res = await qhseFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, page: window.location.hash || null, message })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Merci, votre retour a bien été envoyé !', 'success');
      closeModal(overlay);
    } catch (e) {
      showToast('Échec de l’envoi, réessayez plus tard.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer';
    }
  });

  actions.append(cancelBtn, submitBtn);
  panel.append(actions);
  overlay.append(panel);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
  document.addEventListener(
    'keydown',
    function onKey(e) {
      if (e.key === 'Escape') {
        closeModal(overlay);
        document.removeEventListener('keydown', onKey);
      }
    }
  );

  document.body.append(overlay);
  textarea.focus();
}

/** Injecte un bouton flottant "Feedback" visible sur toutes les pages — idempotent. */
export function mountFeedbackWidget() {
  if (mounted || document.querySelector('.feedback-widget-fab')) return;
  mounted = true;

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'feedback-widget-fab';
  fab.setAttribute('aria-label', 'Signaler un problème ou une suggestion');
  fab.title = 'Signaler un problème ou une suggestion';
  fab.textContent = '💬';
  fab.addEventListener('click', openModal);

  document.body.append(fab);
}

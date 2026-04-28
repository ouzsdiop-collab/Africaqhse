/**
 * Défilement robuste vers une ancre après rendu asynchrone (kanban, tableaux…).
 * @param {string} elementId attribut id du DOM
 * @param {{ maxAttempts?: number; behavior?: ScrollBehavior; block?: ScrollLogicalPosition }} [opts]
 */
export function scheduleScrollIntoView(elementId, opts = {}) {
  const id = String(elementId || '').trim();
  if (!id) return;
  const max = opts.maxAttempts ?? 48;
  let n = 0;
  function tick() {
    const el = document.getElementById(id);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({
          behavior: opts.behavior ?? 'smooth',
          block: opts.block ?? 'start'
        });
      });
      return;
    }
    if (++n >= max) return;
    requestAnimationFrame(tick);
  }
  queueMicrotask(tick);
}

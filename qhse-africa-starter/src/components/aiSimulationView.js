import { formatSimulationPlainText } from './aiSimulation.js';

/**
 * Rendu DOM du résultat structuré (lisibilité type fiche métier).
 * @param {HTMLElement} container
 * @param {{ ref: string, title: string, sections: Array<{ id: string, title: string, items: string[] }> }} result
 */
export function renderSimulationResult(container, result) {
  container.innerHTML = '';
  container.className = 'ai-sim-output ai-sim-output--filled';

  const head = document.createElement('header');
  head.className = 'ai-sim-result-head';
  const ref = document.createElement('span');
  ref.className = 'ai-sim-result-ref';
  ref.textContent = result.ref;
  const tit = document.createElement('h4');
  tit.className = 'ai-sim-result-title';
  tit.textContent = result.title;
  head.append(ref, tit);

  const body = document.createElement('div');
  body.className = 'ai-sim-result-body';

  result.sections.forEach((sec) => {
    const block = document.createElement('section');
    block.className = 'ai-sim-section';
    const h = document.createElement('h5');
    h.className = 'ai-sim-section__title';
    h.textContent = sec.title;
    const ul = document.createElement('ul');
    ul.className = 'ai-sim-section__list';
    sec.items.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.append(li);
    });
    block.append(h, ul);
    body.append(block);
  });

  const foot = document.createElement('p');
  foot.className = 'ai-sim-result-foot';
  foot.textContent =
    'Sortie illustrative. Validation humaine et rattachement à votre système d’information requis pour exploitation réelle.';

  container.append(head, body, foot);
}

/** @param {{ ref: string, title: string, sections: Array<{ title: string, items: string[] }> }} result */
export function getPlainTextForCopy(result) {
  return formatSimulationPlainText(result);
}

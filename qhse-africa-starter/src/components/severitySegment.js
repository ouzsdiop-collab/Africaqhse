const LABELS = {
  faible: 'Faible',
  moyen: 'Moyen',
  critique: 'Critique'
};

/** Segments larges pour saisie terrain (mobilité minier). */
export function createSeveritySegment(initial = 'moyen') {
  const wrap = document.createElement('div');
  wrap.className = 'severity-segment';
  wrap.style.display = 'flex';
  wrap.style.gap = '8px';
  wrap.style.flexWrap = 'wrap';

  let current = initial;
  const buttons = [];

  (['faible', 'moyen', 'critique']).forEach((id) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = LABELS[id];
    btn.dataset.severity = id;
    btn.style.minHeight = '52px';
    btn.style.flex = '1 1 90px';
    btn.style.fontSize = '15px';
    btn.style.fontWeight = '800';
    btn.addEventListener('click', () => {
      current = id;
      sync();
    });
    buttons.push(btn);
    wrap.append(btn);
  });

  function sync() {
    buttons.forEach((btn) => {
      const active = btn.dataset.severity === current;
      btn.classList.toggle('btn-primary', active);
    });
  }

  sync();

  return {
    element: wrap,
    getValue: () => current,
    setValue: (v) => {
      if (LABELS[v]) {
        current = v;
        sync();
      }
    }
  };
}

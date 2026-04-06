/** Historique léger en mémoire (session) — sans backend. */
const MAX = 6;
const entries = [];

/**
 * @param {{ scenarioLabel: string, title: string, ref: string }} entry
 */
export function pushSimulationHistory(entry) {
  entries.unshift({
    ...entry,
    at: Date.now()
  });
  while (entries.length > MAX) entries.pop();
}

export function getSimulationHistory() {
  return entries.map((e) => ({ ...e }));
}

export function clearSimulationHistory() {
  entries.length = 0;
}

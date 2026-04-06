/**
 * Fenêtres temporelles et pic d’incidents — source unique pour vigilance / analyse auto (évite dérive des règles).
 */

export const MS_DAY = 86400000;

export function countIncidentsBetween(incidents, startMs, endMs) {
  if (!Array.isArray(incidents)) return 0;
  let n = 0;
  incidents.forEach((inc) => {
    if (!inc?.createdAt) return;
    const t = new Date(inc.createdAt).getTime();
    if (Number.isNaN(t) || t < startMs || t >= endMs) return;
    n += 1;
  });
  return n;
}

/**
 * @param {unknown[]} incidents
 * @param {number} [nowMs]
 * @returns {{ last7: number; prev7: number; spike: boolean }}
 */
export function computeIncidentWeekMetrics(incidents, nowMs = Date.now()) {
  const list = Array.isArray(incidents) ? incidents : [];
  const startLast7 = nowMs - 7 * MS_DAY;
  const startPrev7 = nowMs - 14 * MS_DAY;
  const last7 = countIncidentsBetween(list, startLast7, nowMs);
  const prev7 = countIncidentsBetween(list, startPrev7, startLast7);
  const spike =
    last7 >= 2 &&
    last7 > prev7 &&
    (prev7 === 0 || last7 >= Math.ceil(prev7 * 1.35) || last7 - prev7 >= 2);
  return { last7, prev7, spike };
}

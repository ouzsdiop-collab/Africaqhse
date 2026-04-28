/** Extrait périmètre, responsable et échéance depuis le texte du champ « detail ». */
export function parseActionMeta(detail) {
  const parts = detail.split('•').map((p) => p.trim());
  let site = 'Non renseigné';
  let owner = 'Non renseigné';
  let echeance = 'Non disponible';

  parts.forEach((p) => {
    if (/^resp/i.test(p)) {
      owner = p.replace(/^resp\.\s*/i, '').trim();
    } else if (/échéance/i.test(p)) {
      const m = p.match(/([\d/]+)/);
      if (m) echeance = m[1];
    } else if (/\+\d+\s*jours/i.test(p)) {
      const m = p.match(/\+\d+\s*jours/i);
      if (m) echeance = `Retard ${m[0]}`;
    } else if (p) {
      site = p;
    }
  });

  return { site, owner, echeance };
}

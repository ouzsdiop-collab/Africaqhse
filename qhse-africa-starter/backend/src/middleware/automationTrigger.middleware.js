/**
 * Déclenchement manuel ou cron : en-tête secret partagé, ou JWT ADMIN / QHSE.
 */
export function requireAutomationTrigger(req, res, next) {
  const secret = process.env.AUTOMATION_SECRET?.trim();
  const header = req.headers['x-automation-secret'];
  if (secret && header === secret) {
    return next();
  }

  const u = req.qhseUser;
  if (!u) {
    return res.status(401).json({ error: 'Authentification requise (ou en-tête X-Automation-Secret)' });
  }

  const r = String(u.role ?? '').trim().toUpperCase();
  if (r === 'ADMIN' || r === 'QHSE') {
    return next();
  }

  return res.status(403).json({ error: 'Réservé administrateur / QHSE ou clé d’automatisation' });
}

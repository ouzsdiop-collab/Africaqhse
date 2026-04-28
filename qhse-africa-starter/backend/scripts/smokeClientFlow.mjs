/**
 * Smoke test API (non destructif si tu le souhaites) — utilise fetch natif.
 *
 * Usage (PowerShell):
 *  $env:SMOKE_API_BASE="http://127.0.0.1:3001"
 *  $env:SMOKE_EMAIL="admin@client.tld"
 *  $env:SMOKE_PASSWORD="..."
 *  node backend/scripts/smokeClientFlow.mjs
 *
 * Optionnel (créations test) :
 *  $env:SMOKE_CREATE="true"
 *
 * NOTE: ce script crée des enregistrements si SMOKE_CREATE=true.
 * Il n'essaie pas de nettoyer (la suppression dépend des règles métier).
 */

const API = (process.env.SMOKE_API_BASE || 'http://127.0.0.1:3001').replace(/\/+$/, '');
const EMAIL = String(process.env.SMOKE_EMAIL || '').trim();
const PASSWORD = String(process.env.SMOKE_PASSWORD || '').trim();
const DO_CREATE = process.env.SMOKE_CREATE === 'true' || process.env.SMOKE_CREATE === '1';

function must(v, name) {
  if (!v) throw new Error(`[smoke] env manquante: ${name}`);
  return v;
}

function logOk(label) {
  console.log(`[ok] ${label}`);
}

async function jfetch(path, init = {}) {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    redirect: 'manual',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const text = await res.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json };
}

async function main() {
  // 1) Health
  {
    const { res } = await jfetch('/api/health');
    if (!res.ok) throw new Error(`[smoke] /api/health KO (${res.status})`);
    logOk('health');
  }

  // 2) Login (token JWT en JSON)
  must(EMAIL, 'SMOKE_EMAIL');
  must(PASSWORD, 'SMOKE_PASSWORD');
  const login = await jfetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: EMAIL, password: PASSWORD })
  });
  if (!login.res.ok) {
    throw new Error(
      `[smoke] login KO (${login.res.status}) ${login.text || ''}`.slice(0, 500)
    );
  }
  const token = login.json?.token;
  if (!token) throw new Error('[smoke] login: token absent');
  logOk('login');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3) Dashboard (au moins 200/403 attendu selon config)
  {
    const { res } = await jfetch('/api/dashboard/stats', { headers: authHeaders });
    if (!(res.status === 200 || res.status === 403)) {
      throw new Error(`[smoke] dashboard summary inattendu (${res.status})`);
    }
    logOk('dashboard stats (200 ou 403 selon tenant/site)');
  }

  if (!DO_CREATE) {
    console.log('[smoke] SMOKE_CREATE=false — stop après endpoints read-only.');
    return;
  }

  // Créations minimales (si le schéma impose un site, cela peut échouer — le but est de détecter tôt).
  // 4) Risk create
  {
    const { res, text } = await jfetch('/api/risks', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: `Smoke Risk ${new Date().toISOString()}`,
        category: 'Sécurité',
        probability: 2,
        gravity: 2,
        status: 'open'
      })
    });
    if (!(res.status === 200 || res.status === 201 || res.status === 400 || res.status === 422)) {
      throw new Error(`[smoke] create risk inattendu (${res.status}) ${String(text).slice(0, 300)}`);
    }
    logOk('create risk (ok ou validation requise)');
  }

  // 5) Incident create
  {
    const { res, text } = await jfetch('/api/incidents', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        ref: `SMOKE-${Date.now()}`,
        type: 'Smoke',
        site: 'SITE',
        severity: 'faible',
        description: 'Smoke incident'
      })
    });
    if (!(res.status === 200 || res.status === 201 || res.status === 400 || res.status === 422)) {
      throw new Error(
        `[smoke] create incident inattendu (${res.status}) ${String(text).slice(0, 300)}`
      );
    }
    logOk('create incident (ok ou validation requise)');
  }

  // 6) Action create
  {
    const { res, text } = await jfetch('/api/actions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: `Smoke Action ${new Date().toISOString()}`,
        status: 'À lancer'
      })
    });
    if (!(res.status === 200 || res.status === 201 || res.status === 400 || res.status === 422)) {
      throw new Error(`[smoke] create action inattendu (${res.status}) ${String(text).slice(0, 300)}`);
    }
    logOk('create action (ok ou validation requise)');
  }

  // 7) Audit create (peut exiger site/ref/score)
  {
    const { res, text } = await jfetch('/api/audits', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        ref: `SMOKE-AUD-${Date.now()}`,
        site: 'SITE',
        score: 0,
        status: 'Planifié',
        checklist: []
      })
    });
    if (!(res.status === 200 || res.status === 201 || res.status === 400 || res.status === 422)) {
      throw new Error(`[smoke] create audit inattendu (${res.status}) ${String(text).slice(0, 300)}`);
    }
    logOk('create audit (ok ou validation requise)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


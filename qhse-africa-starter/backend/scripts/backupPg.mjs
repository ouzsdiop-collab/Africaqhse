import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function env(name, fallback = '') {
  const v = String(process.env[name] || '').trim();
  return v || fallback;
}

function isoStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function runToFile(cmd, args, outFile) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outFile);
    const p = spawn(cmd, args, { shell: true, stdio: ['ignore', 'pipe', 'inherit'] });
    p.stdout.pipe(out);
    p.on('error', reject);
    p.on('exit', (code) => {
      out.end();
      if (code === 0) resolve();
      else reject(new Error(`[backup] échec: ${cmd} ${args.join(' ')} (code=${code})`));
    });
  });
}

async function main() {
  const dbUrl = env('BACKUP_DATABASE_URL', env('DATABASE_URL'));
  if (!dbUrl) throw new Error('[backup] BACKUP_DATABASE_URL (ou DATABASE_URL) manquant.');

  const outDir = path.resolve(process.cwd(), env('BACKUP_OUT_DIR', './backups'));
  ensureDir(outDir);

  const label = env('BACKUP_LABEL', 'backup');
  const fmt = env('BACKUP_FORMAT', 'tar'); // tar = recommandé
  const stamp = isoStamp();

  const ext = fmt === 'custom' ? 'dump' : 'tar';
  const outFile = path.join(outDir, `${label}-${stamp}.${ext}`);

  // pg_dump lit DATABASE_URL directement via --dbname
  const formatFlag = fmt === 'custom' ? '--format=custom' : '--format=tar';

  console.log(`[backup] start -> ${outFile}`);
  await runToFile('pg_dump', ['--dbname', dbUrl, formatFlag, '--no-owner', '--no-acl'], outFile);
  console.log('[backup] ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


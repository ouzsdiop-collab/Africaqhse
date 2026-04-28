import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function env(name, fallback = '') {
  const v = String(process.env[name] || '').trim();
  return v || fallback;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') out.file = argv[i + 1];
  }
  return out;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { shell: true, stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`[restore] échec: ${cmd} ${args.join(' ')} (code=${code})`));
    });
  });
}

async function main() {
  const { file } = parseArgs(process.argv.slice(2));
  if (!file) throw new Error('[restore] Usage: node backend/scripts/restorePg.mjs --file <dump.tar>');

  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) throw new Error(`[restore] dump introuvable: ${abs}`);

  const dbUrl = env('RESTORE_DATABASE_URL', env('DATABASE_URL'));
  if (!dbUrl) throw new Error('[restore] RESTORE_DATABASE_URL (ou DATABASE_URL) manquant.');

  console.log(`[restore] start <- ${abs}`);
  await run('pg_restore', [
    '--dbname',
    dbUrl,
    '--format=tar',
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-acl',
    abs
  ]);
  console.log('[restore] ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


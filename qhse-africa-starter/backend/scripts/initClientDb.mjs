import { spawn } from 'node:child_process';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`[db:init:client] Échec commande: ${cmd} ${args.join(' ')}`));
    });
  });
}

async function main() {
  console.log('[db:init:client] prisma migrate deploy…');
  await run('npx', ['prisma', 'migrate', 'deploy']);
  console.log('[db:init:client] seed client…');
  await run('node', ['prisma/seed.client.js']);
  console.log('[db:init:client] terminé.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


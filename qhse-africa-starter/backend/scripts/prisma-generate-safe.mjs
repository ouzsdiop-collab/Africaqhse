/**
 * Post-install : tente prisma generate sans faire échouer npm install (Windows EPERM, antivirus, etc.).
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

try {
  execSync('npx prisma generate', {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
} catch {
  console.warn('');
  console.warn('⚠️  [qhse-africa-api] prisma generate n’a pas pu terminer (souvent : fichier verrouillé sous Windows).');
  console.warn('   → Fermez les autres terminaux / IDE, ou relancez après npm install :');
  console.warn('      cd backend && npm run db:generate');
  console.warn('   → Si besoin : exclusion antivirus sur le dossier node_modules/.prisma');
  console.warn('');
}

process.exit(0);

/**
 * Stockage fichier — local sous DOCUMENT_STORAGE_PATH ou préparation S3 (variables documentées).
 * Aucun chemin absolu n’est exposé à l’API publique.
 */

import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getBackendRoot() {
  return path.join(__dirname, '..', '..');
}

/**
 * Répertoire racine sécurisé (hors webroot).
 */
export function getStorageRoot() {
  const raw = process.env.DOCUMENT_STORAGE_PATH;
  if (raw && String(raw).trim()) {
    return path.resolve(String(raw).trim());
  }
  return path.join(getBackendRoot(), 'storage', 'controlled-documents');
}

/**
 * Backend prévu : DOCUMENT_STORAGE_BACKEND=s3 — non implémenté ici (SDK + IAM à brancher).
 */
export function getStorageBackend() {
  return (process.env.DOCUMENT_STORAGE_BACKEND || 'local').toLowerCase();
}

/**
 * @param {Buffer} buffer
 * @param {{ originalName: string }} meta
 * @returns {Promise<{ relativePath: string, sizeBytes: number }>}
 */
export async function saveControlledFile(buffer, meta) {
  if (getStorageBackend() === 's3') {
    const err = new Error(
      'Stockage S3 : configurez l’upload côté worker ou implémentez documentStorage.service (DOCUMENT_STORAGE_BACKEND=s3).'
    );
    err.statusCode = 501;
    throw err;
  }

  const root = getStorageRoot();
  const safeBase = path.basename(meta.originalName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const dir = path.join(
    root,
    String(new Date().getUTCFullYear()),
    String(new Date().getUTCMonth() + 1).padStart(2, '0'),
    randomBytes(8).toString('hex')
  );
  await fs.mkdir(dir, { recursive: true });
  const relativePath = path.relative(root, path.join(dir, safeBase));
  const abs = path.join(root, relativePath);
  await fs.writeFile(abs, buffer);
  return { relativePath: relativePath.split(path.sep).join('/'), sizeBytes: buffer.length };
}

/**
 * @param {string} relativePath — valeur stockée en base (séparateurs /)
 */
export async function readControlledFileBuffer(relativePath) {
  if (getStorageBackend() === 's3') {
    const err = new Error('Lecture S3 non implémentée — utilisez DOCUMENT_STORAGE_BACKEND=local.');
    err.statusCode = 501;
    throw err;
  }
  const root = getStorageRoot();
  const normalized = String(relativePath || '').replace(/\\/g, '/');
  const abs = path.normalize(path.join(root, normalized));
  if (!abs.startsWith(path.normalize(root))) {
    const err = new Error('Chemin fichier invalide');
    err.statusCode = 400;
    throw err;
  }
  return fs.readFile(abs);
}

/**
 * @param {string} relativePath
 */
export async function deleteControlledFile(relativePath) {
  if (getStorageBackend() === 's3') return;
  const root = getStorageRoot();
  const normalized = String(relativePath || '').replace(/\\/g, '/');
  const abs = path.normalize(path.join(root, normalized));
  if (!abs.startsWith(path.normalize(root))) return;
  try {
    await fs.unlink(abs);
  } catch {
    /* ignore */
  }
}

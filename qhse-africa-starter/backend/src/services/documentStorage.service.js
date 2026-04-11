/**
 * Stockage fichier — S3 compatible (Scaleway, MinIO, AWS) si S3_BUCKET est défini,
 * sinon disque local sous DOCUMENT_STORAGE_PATH (ou répertoire par défaut backend/storage).
 */

import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_PRESIGN_SECONDS = 3600;

function getBackendRoot() {
  return path.join(__dirname, '..', '..');
}

/**
 * S3 actif uniquement si le bucket est renseigné (priorité sur le mode local).
 * Repli local si S3_BUCKET absent — y compris lorsque DOCUMENT_STORAGE_PATH est défini.
 */
export function isS3StorageEnabled() {
  const b = process.env.S3_BUCKET;
  return Boolean(b && String(b).trim());
}

/**
 * Répertoire racine sécurisé (hors webroot) — mode local uniquement.
 */
export function getStorageRoot() {
  const raw = process.env.DOCUMENT_STORAGE_PATH;
  if (raw && String(raw).trim()) {
    return path.resolve(String(raw).trim());
  }
  return path.join(getBackendRoot(), 'storage', 'controlled-documents');
}

/**
 * @deprecated Préférer isS3StorageEnabled(). Conservé pour compatibilité lecture .env.
 */
export function getStorageBackend() {
  return isS3StorageEnabled() ? 's3' : 'local';
}

/** @type {S3Client | null} */
let s3ClientSingleton = null;

function envBool(name, defaultValue) {
  const v = process.env[name];
  if (v === undefined || v === '') return defaultValue;
  return /^1|true|yes$/i.test(String(v));
}

function getS3Bucket() {
  return String(process.env.S3_BUCKET || '').trim();
}

function getS3Client() {
  if (s3ClientSingleton) return s3ClientSingleton;
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
  const region = (process.env.S3_REGION || 'us-east-1').trim();
  const accessKeyId = process.env.S3_ACCESS_KEY?.trim() || '';
  const secretAccessKey = process.env.S3_SECRET_KEY?.trim() || '';
  if (!accessKeyId || !secretAccessKey) {
    const err = new Error(
      'S3 : renseignez S3_ACCESS_KEY et S3_SECRET_KEY (ou désactivez S3_BUCKET pour le stockage local).'
    );
    err.statusCode = 500;
    throw err;
  }
  const forcePathStyle = envBool('S3_FORCE_PATH_STYLE', Boolean(endpoint));
  s3ClientSingleton = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle
  });
  return s3ClientSingleton;
}

function resetS3ClientForTests() {
  s3ClientSingleton = null;
}

export { resetS3ClientForTests };

/**
 * @param {Buffer} buffer
 * @param {{ originalName: string, contentType?: string | null }} meta
 * @returns {Promise<{ relativePath: string, sizeBytes: number }>}
 */
export async function saveControlledFile(buffer, meta) {
  if (isS3StorageEnabled()) {
    const bucket = getS3Bucket();
    const safeBase = path
      .basename(meta.originalName || 'file')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 120);
    const key = [
      'controlled-documents',
      String(new Date().getUTCFullYear()),
      String(new Date().getUTCMonth() + 1).padStart(2, '0'),
      randomBytes(8).toString('hex'),
      safeBase
    ].join('/');
    const client = getS3Client();
    const contentType =
      meta.contentType && String(meta.contentType).trim()
        ? String(meta.contentType).trim()
        : 'application/octet-stream';
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      })
    );
    return { relativePath: key, sizeBytes: buffer.length };
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

async function streamToBuffer(body) {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (typeof body.transformToByteArray === 'function') {
    const u8 = await body.transformToByteArray();
    return Buffer.from(u8);
  }
  const chunks = [];
  for await (const chunk of /** @type {AsyncIterable<Uint8Array>} */ (body)) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * @param {string} relativePath — clé S3 ou chemin relatif disque
 */
export async function readControlledFileBuffer(relativePath) {
  if (isS3StorageEnabled()) {
    const key = String(relativePath || '').replace(/\\/g, '/').replace(/^\//, '');
    if (!key || key.includes('..')) {
      const err = new Error('Clé fichier invalide');
      err.statusCode = 400;
      throw err;
    }
    const client = getS3Client();
    const out = await client.send(
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: key
      })
    );
    return streamToBuffer(out.Body);
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
  if (isS3StorageEnabled()) {
    const key = String(relativePath || '').replace(/\\/g, '/').replace(/^\//, '');
    if (!key || key.includes('..')) return;
    try {
      const client = getS3Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: getS3Bucket(),
          Key: key
        })
      );
    } catch {
      /* ignore */
    }
    return;
  }

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

/**
 * URL présignée GET (téléchargement), typiquement 1 h.
 * @param {string} storageKey — valeur `path` en base (clé S3)
 * @param {{ fileName: string, mimeType?: string | null, expiresInSeconds?: number }} opts
 * @returns {Promise<string>}
 */
export async function getPresignedControlledDocumentDownloadUrl(storageKey, opts) {
  const key = String(storageKey || '').replace(/\\/g, '/').replace(/^\//, '');
  if (!key || key.includes('..')) {
    const err = new Error('Clé document invalide');
    err.statusCode = 400;
    throw err;
  }
  const expiresIn = Math.min(
    Math.max(60, Number(opts.expiresInSeconds) || DEFAULT_PRESIGN_SECONDS),
    86400
  );
  const fileName = opts.fileName || 'document';
  const mime = opts.mimeType && String(opts.mimeType).trim() ? String(opts.mimeType).trim() : 'application/octet-stream';
  const client = getS3Client();
  const cmd = new GetObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
    ResponseContentType: mime,
    ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
  });
  return getSignedUrl(client, cmd, { expiresIn });
}

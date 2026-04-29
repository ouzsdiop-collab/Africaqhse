/**
 * Stockage fichier — local en dev, S3 compatible en production (Railway).
 *
 * Driver via `STORAGE_DRIVER` :
 * - local : force stockage disque (DOCUMENT_STORAGE_PATH)
 * - s3 : force stockage S3 (S3_BUCKET + identifiants)
 *
 * Compatibilité :
 * - si STORAGE_DRIVER absent : repli ancien (S3 si S3_BUCKET présent, sinon local).
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
 * Driver actif de stockage.
 */
export function getStorageBackend() {
  const raw = process.env.STORAGE_DRIVER;
  const d = raw == null ? '' : String(raw).trim().toLowerCase();
  if (d === 'local') return 'local';
  if (d === 's3') return 's3';

  // Legacy fallback : S3 si bucket présent, sinon local.
  const legacyBucket = process.env.S3_BUCKET;
  return legacyBucket && String(legacyBucket).trim() ? 's3' : 'local';
}

/**
 * S3 actif uniquement si le driver est "s3".
 */
export function isS3StorageEnabled() {
  return getStorageBackend() === 's3';
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
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID?.trim() ||
    process.env.S3_ACCESS_KEY?.trim() ||
    '';
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY?.trim() ||
    process.env.S3_SECRET_KEY?.trim() ||
    '';
  if (!accessKeyId || !secretAccessKey || !getS3Bucket()) {
    const err = new Error(
      'Stockage S3 : configurez STORAGE_DRIVER=s3 et renseignez S3_BUCKET + identifiants S3 (S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY).'
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

function getFileExtension(originalName) {
  const n = String(originalName || '').trim();
  if (!n) return '';
  const ext = path.extname(n).replace('.', '').trim().toLowerCase();
  return ext || '';
}

function normalizeMimeType(m) {
  if (m == null) return '';
  const s = String(m).trim().toLowerCase();
  return s.includes(';') ? s.split(';')[0].trim() : s;
}

function validateControlledUploadMeta(meta, bufferLengthBytes) {
  const originalName = String(meta.originalName || 'file');
  const contentType = normalizeMimeType(meta.contentType || '');
  let ext = getFileExtension(originalName);
  const allowedExts = new Set([
    'pdf',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'bmp',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'csv',
    'txt',
    'rtf',
    'json'
  ]);

  const controlledMax = Number(process.env.CONTROLLED_DOCUMENT_MAX_BYTES) || 25 * 1024 * 1024;
  const isoMax = Number(process.env.ISO_EVIDENCE_MAX_BYTES) || 20 * 1024 * 1024;
  const maxBytes = Math.max(controlledMax, isoMax);

  if (!bufferLengthBytes || bufferLengthBytes <= 0) {
    const err = new Error('Fichier vide ou illisible.');
    err.statusCode = 400;
    throw err;
  }
  if (bufferLengthBytes > maxBytes) {
    const err = new Error(`Fichier trop volumineux (max. ${Math.round(maxBytes / 1024 / 1024)} Mo).`);
    err.statusCode = 413;
    throw err;
  }
  if (!contentType) {
    const err = new Error('Type de fichier non pris en charge (mimetype manquant).');
    err.statusCode = 415;
    throw err;
  }

  function guessExtensionFromMime(mime) {
    const m = String(mime || '').trim().toLowerCase();
    if (!m) return '';
    if (m === 'application/octet-stream') return '';
    if (m === 'application/pdf') return 'pdf';
    if (m === 'text/csv' || m === 'application/csv') return 'csv';
    if (m === 'application/rtf') return 'rtf';
    if (m === 'text/plain') return 'txt';
    if (m.includes('json')) return 'json';
    if (m.startsWith('image/png')) return 'png';
    if (m.startsWith('image/jpeg')) return 'jpeg';
    if (m.startsWith('image/gif')) return 'gif';
    if (m.startsWith('image/webp')) return 'webp';
    if (m.startsWith('image/bmp')) return 'bmp';
    if (m === 'application/msword') return 'doc';
    if (m.includes('wordprocessingml.document')) return 'docx';
    if (m === 'application/vnd.ms-excel' || m === 'application/vnd.ms-office') return 'xls';
    if (m.includes('spreadsheetml.sheet')) return 'xlsx';
    return '';
  }

  // Si l’extension n’est pas fiable (absente ou non reconnue), on valide le couple depuis le mimetype.
  if (!ext || !allowedExts.has(ext)) {
    const guessed = guessExtensionFromMime(contentType);
    if (guessed && allowedExts.has(guessed)) {
      ext = guessed;
    }
  }

  if (!ext || !allowedExts.has(ext)) {
    const err = new Error('Type de fichier non pris en charge (extension).');
    err.statusCode = 415;
    throw err;
  }

  const allowedMimeByExt = {
    pdf: ['application/pdf'],
    png: ['image/png'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    gif: ['image/gif'],
    webp: ['image/webp'],
    bmp: ['image/bmp'],
    doc: ['application/msword'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    xls: ['application/vnd.ms-excel', 'application/vnd.ms-office'],
    xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
    txt: ['text/plain'],
    rtf: ['application/rtf'],
    json: ['application/json', 'text/json']
  };

  // `application/octet-stream` arrive souvent, donc on l’accepte si l’extension est autorisée.
  if (contentType === 'application/octet-stream') return;

  const allowedMimes = allowedMimeByExt[ext] || [];
  if (allowedMimes.length === 0) {
    const err = new Error('Type de fichier non pris en charge.');
    err.statusCode = 415;
    throw err;
  }

  const ok = allowedMimes.some((m) => m === contentType);
  if (!ok) {
    const err = new Error('Type de fichier non pris en charge (mimetype).');
    err.statusCode = 415;
    throw err;
  }
}

/**
 * @param {Buffer} buffer
 * @param {{ originalName: string, contentType?: string | null }} meta
 * @returns {Promise<{ relativePath: string, sizeBytes: number }>}
 */
export async function saveControlledFile(buffer, meta) {
  validateControlledUploadMeta({ originalName: meta.originalName, contentType: meta.contentType }, buffer.length);

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

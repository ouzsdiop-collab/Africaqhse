/**
 * Jetons d’accès fichier — courts, signés, sans exposition du chemin disque.
 * Utilise DOCUMENT_ACCESS_SECRET (ou repli JWT_SECRET) — jamais transmis au client en clair.
 */

import jwt from 'jsonwebtoken';
import { getJwtSecret } from './auth.service.js';

function getDocumentSecret() {
  const d = process.env.DOCUMENT_ACCESS_SECRET;
  if (d && String(d).trim().length >= 16) {
    return String(d).trim();
  }
  return getJwtSecret();
}

/**
 * @param {{
 *   documentId: string,
 *   userId: string,
 *   purpose: 'view' | 'download',
 *   tenantId?: string | null
 * }} payload
 * @param {string} [expiresIn] — défaut 5 min
 */
export function signDocumentAccessToken(payload, expiresIn = '5m') {
  const tid =
    payload.tenantId != null && String(payload.tenantId).trim() !== ''
      ? String(payload.tenantId).trim()
      : undefined;
  return jwt.sign(
    {
      typ: 'qhse_doc',
      docId: payload.documentId,
      purpose: payload.purpose,
      ...(tid ? { tid } : {})
    },
    getDocumentSecret(),
    {
      subject: payload.userId,
      expiresIn,
      issuer: 'qhse-controlled-documents'
    }
  );
}

/**
 * @param {string} token
 * @returns {{ documentId: string, userId: string, purpose: string, tenantId: string | null } | null}
 */
export function verifyDocumentAccessToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const p = jwt.verify(token, getDocumentSecret(), {
      issuer: 'qhse-controlled-documents'
    });
    if (p.typ !== 'qhse_doc' || typeof p.docId !== 'string' || typeof p.sub !== 'string') {
      return null;
    }
    const tid =
      typeof p.tid === 'string' && p.tid.trim() !== '' ? p.tid.trim() : null;
    return {
      documentId: p.docId,
      userId: p.sub,
      purpose: p.purpose === 'download' ? 'download' : 'view',
      tenantId: tid
    };
  } catch {
    return null;
  }
}

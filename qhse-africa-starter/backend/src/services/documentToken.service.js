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
 * @param {{ documentId: string, userId: string, purpose: 'view' | 'download' }} payload
 * @param {string} [expiresIn] — défaut 5 min
 */
export function signDocumentAccessToken(payload, expiresIn = '5m') {
  return jwt.sign(
    {
      typ: 'qhse_doc',
      docId: payload.documentId,
      purpose: payload.purpose
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
 * @returns {{ documentId: string, userId: string, purpose: string } | null}
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
    return {
      documentId: p.docId,
      userId: p.sub,
      purpose: p.purpose === 'download' ? 'download' : 'view'
    };
  } catch {
    return null;
  }
}

import path from 'node:path';

/**
 * Types de fichiers acceptés pour les téléversements documentaires QHSE
 * (documents maîtrisés, preuves ISO, fiches de données de sécurité).
 * Volontairement restrictif : aucun exécutable, script ou format pouvant
 * s'exécuter dans un navigateur (html, svg, js) n'est autorisé.
 */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.csv',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.heic'
]);

/**
 * Multer `fileFilter` : refuse les fichiers dont le type MIME déclaré ET
 * l'extension ne correspondent pas tous les deux à la liste blanche.
 * @returns {(req: unknown, file: import('multer').File, cb: (error: Error | null, acceptFile?: boolean) => void) => void}
 */
export function createDocumentFileFilter() {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
      const err = new Error(
        'Type de fichier non autorisé. Formats acceptés : PDF, Word, Excel, PowerPoint, CSV, TXT, images (JPG/PNG/WEBP/GIF/HEIC).'
      );
      err.code = 'TYPE_NON_AUTORISE';
      return cb(err);
    }
    cb(null, true);
  };
}

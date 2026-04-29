/**
 * StorageService centralisé (upload / download).
 *
 * Convention:
 * - pour préserver la compatibilité existante, les contrôleurs/services continuent d’utiliser
 *   des fonctions nommées (saveControlledFile, readControlledFileBuffer, etc.).
 * - ici on expose une façade "storage.service.js" pour standardiser la configuration via STORAGE_DRIVER.
 */

export {
  isS3StorageEnabled,
  getStorageBackend,
  getStorageRoot,
  saveControlledFile,
  readControlledFileBuffer,
  deleteControlledFile,
  getPresignedControlledDocumentDownloadUrl
} from './documentStorage.service.js';

export { resetS3ClientForTests } from './documentStorage.service.js';


import { createAdminGateShellView } from './AdminGateShell.js';

export async function createAdminGateHomeView({ onSessionExpired } = {}) {
  return createAdminGateShellView({ onSessionExpired });
}

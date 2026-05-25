let unlocked = false;

export function unlockAdminGateSession() {
  unlocked = true;
}

export function isAdminGateUnlocked() {
  return unlocked;
}

export function resetAdminGateSession() {
  unlocked = false;
}

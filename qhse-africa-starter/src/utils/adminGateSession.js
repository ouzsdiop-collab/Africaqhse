let gateToken = '';

export function setGateToken(token) {
  gateToken = String(token || '').trim();
}

export function getGateToken() {
  return gateToken;
}

export function isAdminGateUnlocked() {
  return Boolean(gateToken);
}

export function resetAdminGateSession() {
  gateToken = '';
}

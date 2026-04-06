import { qhseFetch } from '../utils/qhseFetch.js';

/**
 * @returns {Promise<object[]>}
 */
export async function fetchUsers() {
  const res = await qhseFetch('/api/users');
  if (!res.ok) {
    throw new Error(`GET /api/users ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

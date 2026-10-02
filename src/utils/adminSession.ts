import type { AdminScope } from '../server/adminAuth';

const SESSION_ENDPOINTS: Record<AdminScope, { verify: string; logout: string }> = {
  omsk: { verify: '/api/omsk/admin/verify', logout: '/api/omsk/admin/logout' },
  generic: { verify: '/api/admin/verify', logout: '/api/admin/logout' },
};

export interface AdminLoginResult {
  valid: boolean;
  retryAfterSeconds?: number;
}

export function clearLegacyAdminCodes(): void {
  try {
    localStorage.removeItem('omskAdminCodeEntered');
    localStorage.removeItem('spbAdminCodeEntered');
    localStorage.removeItem('adminCodeEntered');
  } catch {
    // Storage can be disabled by the browser; admin sessions do not depend on it.
  }
}

export async function loginAdmin(scope: AdminScope, code: string): Promise<AdminLoginResult> {
  const response = await fetch(SESSION_ENDPOINTS[scope].verify, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (response.status === 429) {
    const retryAfterSeconds = Number(response.headers.get('Retry-After')) || 60;
    return { valid: false, retryAfterSeconds };
  }
  if (!response.ok) return { valid: false };
  const payload = await response.json() as { valid?: boolean };
  return { valid: payload.valid === true };
}

export async function verifyAdminSession(scope: AdminScope): Promise<boolean> {
  const response = await fetch(SESSION_ENDPOINTS[scope].verify, {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!response.ok) return false;
  const payload = await response.json() as { valid?: boolean };
  return payload.valid === true;
}

export async function logoutAdmin(scope: AdminScope): Promise<void> {
  await fetch(SESSION_ENDPOINTS[scope].logout, {
    method: 'POST',
    credentials: 'same-origin',
  });
}

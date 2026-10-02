import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearLegacyAdminCodes, loginAdmin, logoutAdmin, verifyAdminSession } from './adminSession';

const fetchMock = vi.fn();

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('admin session client', () => {
  it('sends the code only to the matching server login endpoint', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ valid: true }) });

    await expect(loginAdmin('omsk', 'secret')).resolves.toEqual({ valid: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/omsk/admin/verify', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'secret' }),
    });
  });

  it('returns the server retry delay when login attempts are rate limited', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({ ok: false, status: 429, headers: new Headers({ 'Retry-After': '37' }) });

    await expect(loginAdmin('generic', 'secret')).resolves.toEqual({ valid: false, retryAfterSeconds: 37 });
  });

  it('verifies and logs out with the scoped cookie without reading or sending stored codes', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ valid: true }) });

    await expect(verifyAdminSession('generic')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/admin/verify', { method: 'POST', credentials: 'same-origin' });
    await logoutAdmin('generic');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  });

  it('removes admin codes left by the previous localStorage login flow', () => {
    const values = new Map([
      ['omskAdminCodeEntered', 'old-omsk-code'],
      ['spbAdminCodeEntered', 'old-spb-code'],
      ['adminCodeEntered', 'old-generic-code'],
    ]);
    vi.stubGlobal('localStorage', { removeItem: (key: string) => values.delete(key) });
    clearLegacyAdminCodes();
    expect(values.size).toBe(0);
  });
});

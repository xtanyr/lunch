import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createAdminAuth } from './adminAuth';

const servers: Server[] = [];

async function startApp(options: Parameters<typeof createAdminAuth>[0]) {
  const auth = createAdminAuth(options);
  const app = express();
  app.set('trust proxy', 'loopback');
  app.use(express.json());
  app.post('/omsk/verify', auth.verify('omsk'));
  app.post('/generic/verify', auth.verify('generic'));
  app.post('/omsk/logout', auth.logout('omsk'));
  app.post('/generic/logout', auth.logout('generic'));
  app.get('/omsk/private', auth.require('omsk'), (_req, res) => res.json({ ok: true }));
  app.get('/generic/private', auth.require('generic'), (_req, res) => res.json({ ok: true }));
  const server = createServer(app).listen(0, '127.0.0.1');
  servers.push(server);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP address');
  return { auth, baseUrl: `http://127.0.0.1:${address.port}` };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe('createAdminAuth', () => {
  it('does not authenticate when a configured code is missing, empty, or wrong', async () => {
    const { baseUrl } = await startApp({ codes: { omsk: 'omsk-secret', generic: 'generic-secret' }, secureCookies: false });
    for (const [path, code] of [['/omsk/verify', undefined], ['/omsk/verify', ''], ['/generic/verify', 'wrong']] as const) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(code === undefined ? {} : { code }),
      });
      expect(response.status).toBe(401);
    }
  });

  it('never authenticates when the server credential is unset or empty', async () => {
    const { baseUrl } = await startApp({ codes: { omsk: undefined, generic: '' }, secureCookies: false });
    for (const [path, code] of [['/omsk/verify', undefined], ['/generic/verify', '']] as const) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(code === undefined ? {} : { code }),
      });
      expect(response.status).toBe(401);
    }
  });

  it('issues scoped HttpOnly cookies with strict browser flags and allows the matching request', async () => {
    const { baseUrl } = await startApp({ codes: { omsk: 'omsk-secret', generic: 'generic-secret' }, secureCookies: true });
    const login = await fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'omsk-secret' }),
    });
    expect(login.status).toBe(200);
    expect(await login.json()).toEqual({ valid: true });
    const cookie = login.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=28800');
    expect(cookie).toContain('Secure');
    expect((await fetch(`${baseUrl}/omsk/private`, { headers: { Cookie: cookie.split(';')[0] } })).status).toBe(200);
  });

  it('rejects wrong-scope and tampered cookies', async () => {
    const { baseUrl } = await startApp({ codes: { omsk: 'omsk-secret', generic: 'generic-secret' }, secureCookies: false });
    const login = await fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'omsk-secret' }),
    });
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    expect((await fetch(`${baseUrl}/generic/private`, { headers: { Cookie: cookie } })).status).toBe(401);
    const [name, value] = cookie.split('=');
    const tampered = `${name}=${value.slice(0, -1)}x`;
    expect((await fetch(`${baseUrl}/omsk/private`, { headers: { Cookie: tampered } })).status).toBe(401);
  });

  it('verifies an existing session without resubmitting the admin code', async () => {
    const { baseUrl } = await startApp({ codes: { omsk: 'omsk-secret', generic: 'generic-secret' }, secureCookies: false });
    const login = await fetch(`${baseUrl}/generic/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'generic-secret' }),
    });
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const verification = await fetch(`${baseUrl}/generic/verify`, { method: 'POST', headers: { Cookie: cookie } });
    expect(verification.status).toBe(200);
    expect(await verification.json()).toEqual({ valid: true });
  });

  it('rejects duplicate cookie names instead of choosing an ambiguous value', async () => {
    const { baseUrl } = await startApp({ codes: { omsk: 'omsk-secret', generic: 'generic-secret' }, secureCookies: false });
    const login = await fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'omsk-secret' }),
    });
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    expect((await fetch(`${baseUrl}/omsk/private`, { headers: { Cookie: `${cookie}; ${cookie}` } })).status).toBe(401);
  });

  it('expires sessions and revokes them on logout', async () => {
    let now = 10_000;
    const { baseUrl } = await startApp({ codes: { omsk: 'omsk-secret', generic: 'generic-secret' }, secureCookies: false, now: () => now });
    const login = await fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'omsk-secret' }),
    });
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    expect((await fetch(`${baseUrl}/omsk/private`, { headers: { Cookie: cookie } })).status).toBe(200);
    const logout = await fetch(`${baseUrl}/omsk/logout`, { method: 'POST', headers: { Cookie: cookie } });
    expect(logout.status).toBe(200);
    expect(logout.headers.get('set-cookie')).toContain('Max-Age=0');
    expect((await fetch(`${baseUrl}/omsk/private`, { headers: { Cookie: cookie } })).status).toBe(401);

    const secondLogin = await fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'omsk-secret' }),
    });
    const secondCookie = secondLogin.headers.get('set-cookie')!.split(';')[0];
    now += 8 * 60 * 60 * 1000 + 1;
    expect((await fetch(`${baseUrl}/omsk/private`, { headers: { Cookie: secondCookie } })).status).toBe(401);
  });

  it('rate limits repeated failed logins per client and resumes after the window', async () => {
    let now = 10_000;
    const { baseUrl } = await startApp({ codes: { omsk: 'omsk-secret', generic: 'generic-secret' }, secureCookies: false, now: () => now });
    const failedAttempts = await Promise.all(Array.from({ length: 10 }, () => fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'wrong' }),
    })));
    expect(failedAttempts.every(response => response.status === 401)).toBe(true);
    const blocked = await fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'omsk-secret' }),
    });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();

    now += 60_001;
    const resumed = await fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'omsk-secret' }),
    });
    expect(resumed.status).toBe(200);
  });

  it('uses distinct trusted client addresses behind the local reverse proxy', async () => {
    const { baseUrl } = await startApp({ codes: { omsk: 'omsk-secret', generic: 'generic-secret' }, secureCookies: false });
    const loginFrom = (address: string, code: string) => fetch(`${baseUrl}/omsk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': address },
      body: JSON.stringify({ code }),
    });

    const failedAttempts = await Promise.all(Array.from({ length: 10 }, () => loginFrom('198.51.100.10', 'wrong')));
    expect(failedAttempts.every(response => response.status === 401)).toBe(true);
    expect((await loginFrom('198.51.100.10', 'omsk-secret')).status).toBe(429);
    expect((await loginFrom('198.51.100.11', 'omsk-secret')).status).toBe(200);
  });
});

import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const activeProcesses: ChildProcess[] = [];
const temporaryDirectories: string[] = [];

async function getFreePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP address');
  const port = address.port;
  await new Promise<void>(resolve => server.close(() => resolve()));
  return port;
}

async function startServer() {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'lunch-hardening-'));
  temporaryDirectories.push(tempDir);
  const dataDir = path.join(tempDir, 'data');
  const port = await getFreePort();
  const child = spawn(processPath(), [
    path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    path.join(projectRoot, 'server.js'),
  ], {
    cwd: tempDir,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      LUNCH_DATA_DIR: dataDir,
      OMSK_ADMIN_CODE: 'test-omsk-code',
      GENERIC_ADMIN_CODE: 'test-generic-code',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  activeProcesses.push(child);
  let output = '';
  child.stdout?.on('data', chunk => { output += chunk.toString(); });
  child.stderr?.on('data', chunk => { output += chunk.toString(); });
  const baseUrl = `http://127.0.0.1:${port}`;

  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited early: ${output}`);
    try {
      const response = await fetch(`${baseUrl}/api/orders/2099-01-01?city=other`);
      if (response.ok) return { baseUrl, dataDir };
    } catch {
      // The child process needs a moment to initialize the database and listen.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  child.kill();
  throw new Error(`Server did not become ready: ${output}`);
}

function processPath(): string {
  return process.execPath;
}

async function stopProcesses() {
  await Promise.all(activeProcesses.splice(0).map(child => new Promise<void>(resolve => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    child.once('exit', () => resolve());
    child.kill();
  })));
  for (const directory of temporaryDirectories.splice(0)) {
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('lunch-hardening-')) {
      throw new Error(`Refusing to remove unexpected test directory: ${resolved}`);
    }
    rmSync(resolved, { recursive: true, force: true });
  }
}

afterEach(stopProcesses);

async function login(baseUrl: string, pathName: string, code: string): Promise<string> {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  expect(response.status).toBe(200);
  return response.headers.get('set-cookie')!.split(';')[0];
}

describe('admin route protection', () => {
  it('filters SPB orders by cafe even if an address file contains mixed entries', async () => {
    const { baseUrl, dataDir } = await startServer();
    const orderDate = '2025-10-08';
    const storedOrders = [
      { id: 'kirova-order', employeeName: 'Test Kirova', department: 'QA', orderDate, address: 'kirova', items: [], timestamp: orderDate },
      { id: 'vokzal-order', employeeName: 'Test Vokzal', department: 'QA', orderDate, address: 'vokzal', items: [], timestamp: orderDate },
      { id: 'later-kirova-order', employeeName: 'Test Later', department: 'QA', orderDate: '2025-10-09', address: 'kirova', items: [], timestamp: orderDate },
      { id: 'legacy-kirova-order', employeeName: 'Test Legacy', department: 'QA', orderDate, items: [], timestamp: orderDate },
    ];
    writeFileSync(path.join(dataDir, 'orders_spb_kirova.json'), JSON.stringify(storedOrders));

    const response = await fetch(`${baseUrl}/api/spb/orders/${orderDate}?address=kirova&city=spb`);
    expect(response.status).toBe(200);
    const orders = await response.json() as Array<{ id: string; address: string }>;
    expect(orders.map(order => order.id)).toEqual(['kirova-order', 'legacy-kirova-order']);
    expect(orders[1].address).toBe('kirova');
  }, 15_000);

  it('rejects unauthed writes and exports, isolates scopes, and preserves public ordering/cancellation', async () => {
    const { baseUrl, dataDir } = await startServer();
    const beforeSpb = readFileSync(path.join(dataDir, 'menu_spb.json'), 'utf8');
    const blockedRange = JSON.stringify({ startDate: '2099-01-01', endDate: '2099-01-02', message: 'blocked' });
    const denied = [
      await fetch(`${baseUrl}/api/menu/items?city=other`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '[]' }),
      await fetch(`${baseUrl}/api/menu/config?city=other`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: [] }) }),
      await fetch(`${baseUrl}/api/disabled-dates?city=other`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: blockedRange }),
      await fetch(`${baseUrl}/api/spb/periods`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }) }),
      await fetch(`${baseUrl}/api/spb/periods/rebuild`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ months: 1 }) }),
      await fetch(`${baseUrl}/api/spb/menu/period-test`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [] }) }),
      await fetch(`${baseUrl}/api/spb/disabled-dates`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: blockedRange }),
      await fetch(`${baseUrl}/api/spb/export/excel?startDate=2026-01-01&endDate=2026-01-02&address=office`),
      await fetch(`${baseUrl}/api/omsk/orders-range?startDate=2026-01-01&endDate=2026-01-02`),
      await fetch(`${baseUrl}/api/omsk/disabled-dates`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: blockedRange }),
      await fetch(`${baseUrl}/api/omsk/settings/sensitive`),
    ];
    expect(denied.map(response => response.status)).toEqual([401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401]);
    expect(readFileSync(path.join(dataDir, 'menu_spb.json'), 'utf8')).toBe(beforeSpb);

    const invalidPublicOrder = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(invalidPublicOrder.status).toBe(400);

    const omskCookie = await login(baseUrl, '/api/omsk/admin/verify', 'test-omsk-code');
    const genericCookie = await login(baseUrl, '/api/admin/verify', 'test-generic-code');
    expect((await fetch(`${baseUrl}/api/omsk/orders-range?startDate=2026-01-01&endDate=2026-01-02`, { headers: { Cookie: omskCookie } })).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/menu/items?city=other`, {
      method: 'PUT', headers: { Cookie: genericCookie, 'Content-Type': 'application/json' }, body: '[]',
    })).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/spb/disabled-dates`, {
      method: 'PUT', headers: { Cookie: omskCookie, 'Content-Type': 'application/json' }, body: blockedRange,
    })).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/spb/disabled-dates`, {
      method: 'PUT', headers: { Cookie: genericCookie, 'Content-Type': 'application/json' }, body: blockedRange,
    })).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/spb/periods`, {
      method: 'POST', headers: { Cookie: genericCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }),
    })).status).toBe(200);

    const newOrder = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeName: 'Test Employee', department: 'QA', orderDate: '2099-01-02', items: [], address: 'office_10', city: 'other' }),
    });
    expect(newOrder.status).toBe(201);
    const created = await newOrder.json() as { id: string; cancellationToken: string; cancelTokenHash?: string };
    expect(created.cancellationToken).toMatch(/^[a-f0-9]{64}$/);
    expect(created.cancelTokenHash).toBeUndefined();
    const list = await fetch(`${baseUrl}/api/orders/2099-01-02?city=other&address=office_10`).then(response => response.json()) as Array<Record<string, unknown>>;
    expect(list).toHaveLength(1);
    expect(list[0]).not.toHaveProperty('cancellationToken');
    expect(list[0]).not.toHaveProperty('cancellationTokenHash');
    expect(list[0]).not.toHaveProperty('cancelTokenHash');
    const storedBeforeDelete = readFileSync(path.join(dataDir, 'orders_other_office_10.json'), 'utf8');
    expect(storedBeforeDelete).not.toContain(created.cancellationToken);
    expect(storedBeforeDelete).toContain('cancellationTokenHash');

    const deniedDelete = await fetch(`${baseUrl}/api/orders/${created.id}?city=other&address=office_10`, { method: 'DELETE' });
    expect(deniedDelete.status).toBe(401);
    const wrongTokenDelete = await fetch(`${baseUrl}/api/orders/${created.id}?city=other&address=office_10`, {
      method: 'DELETE', headers: { 'x-order-cancellation-token': `${created.cancellationToken.slice(0, -1)}0` },
    });
    expect(wrongTokenDelete.status).toBe(401);
    const validDelete = await fetch(`${baseUrl}/api/orders/${created.id}?city=other&address=office_10`, {
      method: 'DELETE', headers: { 'x-order-cancellation-token': created.cancellationToken },
    });
    expect(validDelete.status).toBe(204);
    const stored = readFileSync(path.join(dataDir, 'orders_other_office_10.json'), 'utf8');
    expect(stored).toBe('[]');

    const omskOrder = await fetch(`${baseUrl}/api/omsk/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeName: 'Omsk test', department: 'QA', orderDate: '2099-01-03', items: [], address: 'office' }),
    });
    expect(omskOrder.status).toBe(201);
    const omskCreated = await omskOrder.json() as { id: string; cancellationToken: string };
    const omskList = await fetch(`${baseUrl}/api/omsk/orders/2099-01-03?address=office`).then(response => response.json()) as Array<Record<string, unknown>>;
    expect(omskList).toHaveLength(1);
    expect(omskList[0]).not.toHaveProperty('cancellationTokenHash');
    expect((await fetch(`${baseUrl}/api/omsk/orders/${omskCreated.id}?address=office`, { method: 'DELETE' })).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/omsk/orders/${omskCreated.id}?address=office`, {
      method: 'DELETE', headers: { 'x-order-cancellation-token': omskCreated.cancellationToken },
    })).status).toBe(204);
  });
});

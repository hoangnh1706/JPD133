import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

test('register, isolate progress, log out and sign back in', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'jpd133-auth-'));
  process.env.JPD133_DATA_DIR = dir;
  const { createAppServer, closeDatabase } = await import('./index.mjs');
  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, method = 'GET', body, cookie = '') => fetch(base + path, { method, headers: { Origin: base, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  try {
    const guest = await request('/api/grammar-pdf/08'); assert.equal(guest.status, 200); await guest.body.cancel();
    assert.equal((await request('/api/progress', 'PUT', { events: [] })).status, 401);
    const first = await request('/api/auth/register', 'POST', { name: 'Lan', email: 'lan@example.com', password: 'strong-password-123' }); assert.equal(first.status, 201);
    const cookie = first.headers.get('set-cookie').split(';')[0]; assert.match(first.headers.get('set-cookie'), /HttpOnly.*SameSite=Strict/);
    const me = await request('/api/auth/me', 'GET', undefined, cookie); assert.equal((await me.json()).user.email, 'lan@example.com');
    const pdf = await request('/api/grammar-pdf/08', 'GET', undefined, cookie); assert.equal(pdf.status, 200); assert.equal(pdf.headers.get('content-type'), 'application/pdf'); await pdf.body.cancel();
    const progress = { events: [{ type: 'reading', at: new Date().toISOString(), id: 1 }], bookmarks: [1], favorites: [], settings: { theme: 'dark', furigana: true, sakura: true, sakuraIntensity: 'normal', rate: 1 } };
    assert.equal((await request('/api/progress', 'PUT', progress, cookie)).status, 200);
    const second = await request('/api/auth/register', 'POST', { name: 'Minh', email: 'minh@example.com', password: 'strong-password-456' }); const secondCookie = second.headers.get('set-cookie').split(';')[0];
    assert.deepEqual((await (await request('/api/auth/me', 'GET', undefined, secondCookie)).json()).progress.events, []);
    assert.equal((await request('/api/auth/logout', 'POST', {}, cookie)).status, 200);
    assert.equal((await (await request('/api/auth/me', 'GET', undefined, cookie)).json()).user, null);
    assert.equal((await request('/api/auth/login', 'POST', { email: 'lan@example.com', password: 'wrong-password' })).status, 401);
    const login = await request('/api/auth/login', 'POST', { email: 'lan@example.com', password: 'strong-password-123' }); assert.equal(login.status, 200); assert.deepEqual((await login.json()).progress, progress);
    const direct = await request('/nihongo/speaking-exam'); assert.equal(direct.status, 200); assert.match(await direct.text(), /<div id="root"><\/div>/);
  } finally { await new Promise(done => server.close(done)); closeDatabase(); if (!resolve(dir).startsWith(resolve(tmpdir()) + sep)) throw new Error('Unsafe temporary test path'); rmSync(dir, { recursive: true, force: true }); }
});

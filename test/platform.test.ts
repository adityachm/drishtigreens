import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import app from '../src/index.tsx';
import type { Bindings } from '../src/env.ts';
import { migrate, openDb, type Db } from '../src/platform/db.ts';
import { FileStorage } from '../src/platform/storage.ts';
import { withForwardedProto } from '../src/platform/http.ts';
import { parseEnvFile } from '../src/platform/config.ts';
import { hashPassword } from '../src/lib/password.ts';
import { recordFailure, lockoutRemaining } from '../src/lib/auth.ts';
import type { MailMessage, Mailer } from '../src/lib/mail.ts';

let dir: string;
let db: Db;
let raw: DatabaseSync;
let env: Bindings;
const sent: MailMessage[] = [];
let mailFails = false;
const fakeMailer: Mailer = {
  from: 'alerts@example.com',
  async send(m) {
    if (mailFails) throw new Error('535 bad credentials');
    sent.push(m);
  },
};

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'dg-test-'));
  ({ db, raw } = openDb(join(dir, 'test.sqlite')));
  migrate(raw, 'migrations');
  env = { DB: db, MEDIA: new FileStorage(join(dir, 'media')), VERSION: 'test', TURNSTILE_SITE_KEY: '', TURNSTILE_SECRET: '', MAILER: fakeMailer };
});

afterAll(() => {
  raw.close();
  rmSync(dir, { recursive: true, force: true });
});

const ORIGIN = 'https://drishtigreens.com';
const call = (path: string, init: RequestInit = {}) => app.fetch(new Request(ORIGIN + path, init), env);
const form = (data: Record<string, string>) => new URLSearchParams(data);
async function emailStatus(name: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const r = await db.prepare('SELECT email_status FROM enquiries WHERE name = ?').bind(name).first<{ email_status: string }>();
    if (r?.email_status) return r.email_status;
    await new Promise((res) => setTimeout(res, 10));
  }
  return '';
}

describe('database', () => {
  it('records applied migrations and skips them next time', () => {
    expect(migrate(raw, 'migrations')).toEqual([]);
  });

  it('supports numbered parameters, batches and missing rows', async () => {
    await recordFailure(db, '1.2.3.4');
    await recordFailure(db, '1.2.3.4');
    const row = await db.prepare('SELECT failures FROM login_attempts WHERE ip = ?').bind('1.2.3.4').first<{ failures: number }>();
    expect(row?.failures).toBe(2);
    expect(await db.prepare('SELECT 1 FROM media WHERE id = ?').bind('nope').first()).toBeNull();
    const [a, b] = await db.batch([db.prepare('SELECT 7 AS n'), db.prepare('DELETE FROM login_attempts')]);
    expect(a.results).toEqual([{ n: 7 }]);
    expect(b.results).toEqual([]);
  });

  it('locks an IP after five failures', async () => {
    for (let i = 0; i < 5; i++) await recordFailure(db, '5.6.7.8');
    expect(await lockoutRemaining(db, '5.6.7.8')).toBeGreaterThan(800);
    await db.prepare('DELETE FROM login_attempts').run();
  });

  it('rolls back a batch that fails part-way', async () => {
    await expect(
      db.batch([db.prepare("INSERT INTO content (key, value) VALUES ('x', '{}')"), db.prepare('INSERT INTO nope VALUES (1)')]),
    ).rejects.toThrow();
    expect(await db.prepare("SELECT 1 FROM content WHERE key = 'x'").first()).toBeNull();
  });
});

describe('file storage', () => {
  it('stores, lists, serves with etags and deletes', async () => {
    const s = env.MEDIA;
    await s.put('media/abc/480.webp', new Blob([new Uint8Array([1, 2, 3])]));
    await s.put('media/abc/original.jpg', new Blob([new Uint8Array([4])]));
    expect((await s.list('media/abc/')).sort()).toEqual(['media/abc/480.webp', 'media/abc/original.jpg']);
    const got = await s.get('media/abc/480.webp');
    expect(got?.contentType).toBe('image/webp');
    expect(new Uint8Array(await new Response(got!.body).arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect((await s.get('media/abc/480.webp', got!.etag))?.body).toBeNull();
    await s.delete(await s.list('media/abc/'));
    expect(await s.get('media/abc/480.webp')).toBeNull();
  });

  it('refuses keys that escape the storage folder', async () => {
    await expect(env.MEDIA.put('../escape.txt', new Blob(['x']))).rejects.toThrow('Invalid storage key');
    await expect(env.MEDIA.get('media/../../etc/passwd')).rejects.toThrow('Invalid storage key');
  });
});

describe('config and proxy', () => {
  it('reads secrets files without expanding $', () => {
    expect(parseEnvFile('# note\nA=1\nB="x$y"\n bad line\nC=\'z\'')).toEqual({ A: '1', B: 'x$y', C: 'z' });
  });

  it('treats requests forwarded from HTTPS as HTTPS', () => {
    const r = withForwardedProto(new Request('http://drishtigreens.com/admin', { headers: { 'x-forwarded-proto': 'https' } }));
    expect(r.url).toBe('https://drishtigreens.com/admin');
    expect(withForwardedProto(new Request('http://localhost/')).url).toBe('http://localhost/');
  });
});

describe('app', () => {
  let cookie = '';

  it('serves the page and the health check', async () => {
    for (const p of ['/', '/sitemap.xml', '/robots.txt']) expect((await call(p)).status, p).toBe(200);
    expect((await call('/no-such-page')).status).toBe(404);
    expect(await (await call('/healthz')).text()).toBe('ok');
  });

  it('sends the old page addresses to their sections', async () => {
    const moved: [string, string][] = [
      ['/about', '/#about'],
      ['/services', '/#services'],
      ['/services/tree-relocation', '/#services'],
      ['/projects', '/#projects'],
      ['/projects?category=trees', '/#projects'],
      ['/contact', '/#contact'],
    ];
    for (const [from, to] of moved) {
      const r = await call(from);
      expect(r.status, from).toBe(301);
      expect(r.headers.get('location'), from).toBe(to);
    }
  });

  it('says when no admin password has been set', async () => {
    expect(await (await call('/admin/login')).text()).toContain('No admin password has been set');
  });

  it('signs in with the right password only', async () => {
    await db.prepare('INSERT INTO admin_user (id, password_hash) VALUES (1, ?)').bind(await hashPassword('a-good-password')).run();
    const bad = await call('/admin/login', { method: 'POST', body: form({ password: 'wrong' }), headers: { Origin: ORIGIN } });
    expect(bad.status).toBe(400);
    const ok = await call('/admin/login', { method: 'POST', body: form({ password: 'a-good-password' }), headers: { Origin: ORIGIN } });
    expect(ok.status).toBe(303);
    const set = ok.headers.get('set-cookie')!;
    expect(set).toMatch(/HttpOnly/i);
    expect(set).toMatch(/Secure/i);
    expect(set).toMatch(/SameSite=Strict/i);
    expect(set).toMatch(/Path=\/admin/i);
    cookie = set.split(';')[0];
    expect((await call('/admin', { headers: { cookie } })).status).toBe(200);
  });

  it('rejects admin posts from other sites', async () => {
    const r = await call('/admin/edit/settings', { method: 'POST', body: form({ phone: '1' }), headers: { cookie, Origin: 'https://evil.example' } });
    expect(r.status).toBe(403);
  });

  it('publishes a saved edit immediately', async () => {
    const r = await call('/admin/edit/settings', {
      method: 'POST',
      headers: { cookie, Origin: ORIGIN },
      body: form({ phone: '+91 98450 12345', whatsapp: '919845012345', email: '', address: '', consult_line: 'Call', service_areas: 'Bengaluru', logo: '', tagline: 'T', footer_blurb: '', footer_line: '' }),
    });
    expect(r.status).toBe(303);
    const home = await (await call('/')).text();
    expect(home).toContain('+91 98450 12345');
    expect(home).toContain('https://wa.me/919845012345');
  });

  it('saves contact enquiries and shows them in the admin inbox', async () => {
    const r = await call('/contact', { method: 'POST', body: form({ name: 'Asha', phone: '98450 12345', message: 'Lawn redesign' }) });
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/?sent=1#contact');
    expect(await (await call('/admin/enquiries', { headers: { cookie } })).text()).toContain('Asha');
  });

  it('does not email enquiries until someone is set to receive them', async () => {
    expect(await emailStatus('Asha')).toBe('');
    expect(sent).toHaveLength(0);
  });

  it('emails new enquiries to the alert addresses with Reply-To set', async () => {
    await db
      .prepare("INSERT OR REPLACE INTO content (key, value) VALUES ('settings', ?)")
      .bind(JSON.stringify({ notify_emails: ['owner@example.com', 'partner@example.com'] }))
      .run();
    await call('/contact', { method: 'POST', body: form({ name: 'Meera', phone: '98450 00000', email: 'meera@example.com', message: 'Terrace garden' }) });
    expect(await emailStatus('Meera')).toBe('sent');
    expect(sent.at(-1)).toMatchObject({ to: ['owner@example.com', 'partner@example.com'], replyTo: 'meera@example.com' });
    expect(sent.at(-1)!.text).toContain('Terrace garden');
  });

  it('keeps the enquiry and flags it when the email fails', async () => {
    mailFails = true;
    const r = await call('/contact', { method: 'POST', body: form({ name: 'Kiran', phone: '98450 11111' }) });
    expect(r.status).toBe(303);
    expect(await emailStatus('Kiran')).toBe('failed');
    expect(await (await call('/admin/enquiries', { headers: { cookie } })).text()).toContain('Email alert failed');
    mailFails = false;
  });

  it('sends a test email from the dashboard', async () => {
    const r = await call('/admin/test-email', { method: 'POST', headers: { cookie, Origin: ORIGIN } });
    expect(r.status).toBe(303);
    expect(sent.at(-1)!.subject).toContain('Test');
  });

  it('accepts an uploaded photo and serves its resized copies', async () => {
    const fd = new FormData();
    fd.append('ext', 'webp');
    fd.append('width', '1200');
    fd.append('height', '900');
    for (const w of [480, 960]) {
      fd.append('widths', String(w));
      fd.append(`variant_${w}`, new File([new Uint8Array([w % 256])], `${w}.webp`, { type: 'image/webp' }));
    }
    fd.append('original', new File([new Uint8Array([9])], 'garden.jpg', { type: 'image/jpeg' }));
    fd.append('alt', 'A garden');
    const r = await call('/admin/api/media', { method: 'POST', body: fd, headers: { cookie, Origin: ORIGIN } });
    expect(r.status).toBe(200);
    const m = (await r.json()) as { id: string; thumb: string };
    const img = await call(m.thumb);
    expect(img.status).toBe(200);
    expect(img.headers.get('cache-control')).toContain('immutable');
    expect((await call(m.thumb, { headers: { 'if-none-match': img.headers.get('etag')! } })).status).toBe(304);
  });

  it('shows form mistakes on the page, at the form, keeping what was typed', async () => {
    const r = await call('/contact', { method: 'POST', body: form({ name: '', phone: '12', city: 'Mysuru' }) });
    expect(r.status).toBe(400);
    const html = await r.text();
    expect(html).toContain('Please enter your name.');
    expect(html).toContain('value="Mysuru"');
    expect(html).toContain('id="home"');
  });

  it('ends the session on sign-out', async () => {
    await call('/admin/logout', { method: 'POST', headers: { cookie, Origin: ORIGIN } });
    const r = await call('/admin', { headers: { cookie } });
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/admin/login');
  });
});

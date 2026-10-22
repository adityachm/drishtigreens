import { Hono, type Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { csrf } from 'hono/csrf';
import type { Child } from 'hono/jsx';
import { assetVersion, renderPage, turnstileKey, type AppEnv, type Ctx } from '../env.ts';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  checkPassword,
  clearFailures,
  createSession,
  destroySession,
  hasAdminPassword,
  isValidSession,
  lockoutRemaining,
  recordFailure,
  setPasswordHash,
} from '../lib/auth.ts';
import { hashPassword, MIN_PASSWORD_LENGTH } from '../lib/password.ts';
import {
  MAX_ORIGINAL_BYTES,
  MAX_VARIANT_BYTES,
  MEDIA_ID,
  isReferenced,
  mediaQuery,
  rowToMedia,
  urlAtLeast,
  type Media,
} from '../lib/media.ts';
import { clientIp, verifyTurnstile } from '../lib/util.ts';
import { formSource, parseSections } from '../content/fields.ts';
import { docDef, type DocKey } from '../content/schema.ts';
import { loadDocs, saveDoc } from '../content/store.ts';
import type { Db } from '../platform/db.ts';
import { AdminLayout, LoginPage, type Flash } from '../views/admin/layout.tsx';
import { Editor } from '../views/admin/editor.tsx';
import { AccountPage, Dashboard, EnquiriesPage, MediaPage, type Enquiry } from '../views/admin/pages.tsx';
import { alertRecipients } from '../lib/alerts.ts';

const admin = new Hono<AppEnv>();

const FLASH: Record<string, string> = {
  saved: 'Saved. Your changes are live on the website.',
  alt: 'Photo description saved.',
  deleted: 'Deleted.',
  password: 'Password changed. Other devices have been signed out.',
  'test-email': 'Test email sent. Check the inbox (and the spam folder the first time).',
};

admin.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
  c.header('X-Frame-Options', 'DENY');
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' blob: data:; " +
      "frame-src https://challenges.cloudflare.com; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
  );
});

// Rejects form posts and uploads that come from another site.
admin.use('*', csrf());

function cookieOptions(c: Ctx) {
  return {
    path: '/admin',
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Strict' as const,
  };
}

admin.use('*', async (c: Ctx, next: Next) => {
  if (c.req.path === '/admin/login') return next();
  if (await isValidSession(c.env.DB, getCookie(c, SESSION_COOKIE))) return next();
  if (c.req.path.startsWith('/admin/api/')) return c.json({ error: 'Your session has ended. Sign in again.' }, 401);
  return c.redirect('/admin/login', 303);
});

async function page(c: Ctx, title: string, active: string, body: Child, flash?: Flash, status: 200 | 400 = 200) {
  const row = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'").first<{ n: number }>();
  const ok = c.req.query('ok');
  const f = flash ?? (ok && FLASH[ok] ? { kind: 'ok' as const, text: FLASH[ok] } : undefined);
  return renderPage(
    c,
    <AdminLayout title={title} active={active} v={assetVersion(c.env)} flash={f} newEnquiries={row?.n ?? 0}>
      {body}
    </AdminLayout>,
    status,
  );
}

// ---- Sign in / out ----

admin.get('/login', async (c) => {
  if (await isValidSession(c.env.DB, getCookie(c, SESSION_COOKIE))) return c.redirect('/admin', 303);
  return renderPage(
    c,
    <LoginPage v={assetVersion(c.env)} noPassword={!(await hasAdminPassword(c.env.DB))} turnstileKey={turnstileKey(c.env)} />,
  );
});

admin.post('/login', async (c) => {
  const db = c.env.DB;
  const ip = clientIp(c.req.raw.headers);
  const v = assetVersion(c.env);
  const tKey = turnstileKey(c.env);
  const fail = async (error: string, status: 400 | 429 = 400) =>
    renderPage(c, <LoginPage v={v} error={error} noPassword={!(await hasAdminPassword(db))} turnstileKey={tKey} />, status);

  const wait = await lockoutRemaining(db, ip);
  if (wait > 0) return fail(`Too many wrong attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, 429);

  const form = await c.req.formData();
  if (tKey) {
    const token = String(form.get('cf-turnstile-response') ?? '');
    if (!(await verifyTurnstile(c.env.TURNSTILE_SECRET!, token, ip))) return fail('The security check failed. Please try again.');
  }
  const password = String(form.get('password') ?? '');
  if (!password || password.length > 200 || !(await checkPassword(db, password))) {
    await recordFailure(db, ip);
    return fail('That password is not correct.');
  }
  await clearFailures(db, ip);
  const token = await createSession(db);
  setCookie(c, SESSION_COOKIE, token, { ...cookieOptions(c), maxAge: SESSION_TTL_SECONDS });
  return c.redirect('/admin', 303);
});

admin.post('/logout', async (c) => {
  await destroySession(c.env.DB, getCookie(c, SESSION_COOKIE));
  deleteCookie(c, SESSION_COOKIE, cookieOptions(c));
  return c.redirect('/admin/login', 303);
});

// ---- Dashboard ----

admin.get('/', async (c) => {
  const [recent, count] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT * FROM enquiries ORDER BY created_at DESC, id DESC LIMIT 5'),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'"),
  ]);
  const n = (count.results[0] as { n: number }).n;
  const docs = await loadDocs(c.env.DB);
  const mail = { configured: c.env.MAILER !== null, from: c.env.MAILER?.from ?? '', to: alertRecipients(docs) };
  return page(c, 'Dashboard', '/admin', <Dashboard recent={recent.results as Enquiry[]} newCount={n} mail={mail} />);
});

admin.post('/test-email', async (c) => {
  const to = alertRecipients(await loadDocs(c.env.DB));
  const fail = (text: string) => page(c, 'Dashboard', '/admin', <p class="card">{text}</p>, { kind: 'error', text: 'Test email not sent.' }, 400);
  if (!c.env.MAILER) return fail('Sending isn’t set up on the server (no SMTP settings).');
  if (!to.length) return fail('There is no address to send to. Add one in Site settings → Enquiry alerts.');
  try {
    await c.env.MAILER.send({
      to,
      subject: 'Test: Drishti Greens enquiry alerts',
      text: `This is a test from the Drishti Greens admin panel.\n\nNew enquiries from the website will be emailed to: ${to.join(', ')}.`,
    });
  } catch (e) {
    return fail(`The mail server said: ${(e as Error).message}`);
  }
  return c.redirect('/admin?ok=test-email', 303);
});

// ---- Content editors ----

async function allMedia(db: Db): Promise<Map<string, Media>> {
  const { results } = await mediaQuery(db).all();
  return new Map(results.map((r) => [String(r.id), rowToMedia(r as unknown as Parameters<typeof rowToMedia>[0])]));
}

admin.get('/edit/:doc', async (c) => {
  const def = docDef(c.req.param('doc'));
  if (!def) return c.notFound();
  const [docs, media] = await Promise.all([loadDocs(c.env.DB), allMedia(c.env.DB)]);
  const value = docs[def.key] as unknown as Record<string, unknown>;
  return page(c, def.title, `/admin/edit/${def.key}`, <Editor def={def} value={value} media={media} errors={[]} />);
});

admin.post('/edit/:doc', async (c) => {
  const def = docDef(c.req.param('doc'));
  if (!def) return c.notFound();
  const errors: string[] = [];
  const value = parseSections(def.sections, formSource(await c.req.formData()), errors);
  if (errors.length) {
    const media = await allMedia(c.env.DB);
    return page(c, def.title, `/admin/edit/${def.key}`, <Editor def={def} value={value} media={media} errors={errors} />, undefined, 400);
  }
  await saveDoc(c.env.DB, def.key as DocKey, value);
  return c.redirect(`/admin/edit/${def.key}?ok=saved`, 303);
});

// ---- Photos ----

admin.get('/media', async (c) => {
  const [docs, media] = await Promise.all([loadDocs(c.env.DB), allMedia(c.env.DB)]);
  const items = [...media.values()];
  const used = new Set(items.filter((m) => isReferenced(docs, m.id)).map((m) => m.id));
  return page(c, 'Photos', '/admin/media', <MediaPage items={items} used={used} />);
});

admin.get('/api/media', async (c) => {
  const media = await allMedia(c.env.DB);
  return c.json([...media.values()].map((m) => ({ id: m.id, alt: m.alt, thumb: urlAtLeast(m, 480), width: m.width, height: m.height })));
});

const ORIGINAL_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

// Receives a photo already resized in the browser: the original file plus up to three resized copies.
admin.post('/api/media', async (c) => {
  const form = await c.req.formData();
  const bad = (error: string) => c.json({ error }, 400);

  const ext = form.get('ext');
  if (ext !== 'webp' && ext !== 'jpg') return bad('Unsupported image format.');
  const mime = ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const width = Number(form.get('width'));
  const height = Number(form.get('height'));
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 20000 || height > 20000) {
    return bad('Invalid image size.');
  }
  const widths = form
    .getAll('widths')
    .map(Number)
    .sort((a, b) => a - b);
  if (widths.length < 1 || widths.length > 3 || widths.some((w, i) => !Number.isInteger(w) || w < 1 || w > 4000 || w === widths[i - 1])) {
    return bad('Invalid resized copies.');
  }
  const variants: [number, File][] = [];
  for (const w of widths) {
    const f = form.get(`variant_${w}`);
    if (!(f instanceof File) || f.type !== mime || f.size > MAX_VARIANT_BYTES) return bad('A resized copy is missing or too large.');
    variants.push([w, f]);
  }
  const original = form.get('original');
  if (!(original instanceof File) || original.size > MAX_ORIGINAL_BYTES) return bad('The photo is missing or larger than 25 MB.');
  const origExt = ORIGINAL_EXT[original.type];
  if (!origExt) return bad('Please upload a JPG, PNG, WebP, HEIC, GIF or AVIF photo.');
  const alt = String(form.get('alt') ?? '').trim().slice(0, 250);

  const id = crypto.randomUUID();
  const originalKey = `media/${id}/original.${origExt}`;
  await Promise.all([
    ...variants.map(([w, f]) =>
      c.env.MEDIA.put(`media/${id}/${w}.${ext}`, f),
    ),
    c.env.MEDIA.put(originalKey, original),
  ]);
  const bytes = original.size + variants.reduce((n, [, f]) => n + f.size, 0);
  await c.env.DB.prepare(
    `INSERT INTO media (id, alt, width, height, ext, widths, original_key, original_name, bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, alt, width, height, ext, JSON.stringify(widths), originalKey, original.name.slice(0, 200), bytes)
    .run();
  const m: Media = { id, alt, width, height, ext, widths, original_key: originalKey, original_name: original.name, bytes, created_at: '' };
  return c.json({ id, alt, thumb: urlAtLeast(m, 480), width, height });
});

admin.post('/media/:id', async (c) => {
  const id = c.req.param('id');
  if (!MEDIA_ID.test(id)) return c.notFound();
  const form = await c.req.formData();
  const alt = String(form.get('alt') ?? '').trim().slice(0, 250);
  await c.env.DB.prepare('UPDATE media SET alt = ? WHERE id = ?').bind(alt, id).run();
  return c.redirect('/admin/media?ok=alt', 303);
});

admin.post('/media/:id/delete', async (c) => {
  const id = c.req.param('id');
  if (!MEDIA_ID.test(id)) return c.notFound();
  const docs = await loadDocs(c.env.DB);
  if (isReferenced(docs, id)) {
    return page(c, 'Photos', '/admin/media', <p class="card">This photo is used on the website. Replace it there first, then delete it.</p>, {
      kind: 'error',
      text: 'Photo not deleted.',
    }, 400);
  }
  await c.env.MEDIA.delete(await c.env.MEDIA.list(`media/${id}/`));
  await c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
  return c.redirect('/admin/media?ok=deleted', 303);
});

// ---- Enquiries ----

admin.get('/enquiries', async (c) => {
  const show = ['new', 'handled', 'all'].includes(c.req.query('show') ?? '') ? c.req.query('show')! : 'new';
  const stmt =
    show === 'all'
      ? c.env.DB.prepare('SELECT * FROM enquiries ORDER BY created_at DESC, id DESC LIMIT 200')
      : c.env.DB.prepare('SELECT * FROM enquiries WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT 200').bind(show);
  const { results } = await stmt.all<Enquiry>();
  return page(c, 'Enquiries', '/admin/enquiries', <EnquiriesPage items={results} filter={show} />);
});

admin.post('/enquiries/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  const status = String((await c.req.formData()).get('status'));
  if (!Number.isInteger(id) || (status !== 'new' && status !== 'handled')) return c.notFound();
  await c.env.DB.prepare('UPDATE enquiries SET status = ? WHERE id = ?').bind(status, id).run();
  return c.redirect(c.req.header('referer')?.includes('/admin/enquiries') ? c.req.header('referer')! : '/admin/enquiries', 303);
});

admin.post('/enquiries/:id/delete', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.notFound();
  await c.env.DB.prepare('DELETE FROM enquiries WHERE id = ?').bind(id).run();
  return c.redirect('/admin/enquiries?ok=deleted', 303);
});

// ---- Password ----

admin.get('/account', (c) => page(c, 'Password', '/admin/account', <AccountPage errors={[]} />));

admin.post('/account', async (c) => {
  const form = await c.req.formData();
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  const errors: string[] = [];
  if (!(await checkPassword(c.env.DB, current))) errors.push('The current password is not correct.');
  if (next.length < MIN_PASSWORD_LENGTH) errors.push(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (next.length > 200) errors.push('The new password is too long.');
  if (next !== confirm) errors.push('The two new passwords do not match.');
  if (errors.length) return page(c, 'Password', '/admin/account', <AccountPage errors={errors} />, undefined, 400);

  // Replaces the hash and removes every session, then signs this device back in.
  await setPasswordHash(c.env.DB, await hashPassword(next));
  const token = await createSession(c.env.DB);
  setCookie(c, SESSION_COOKIE, token, { ...cookieOptions(c), maxAge: SESSION_TTL_SECONDS });
  return c.redirect('/admin/account?ok=password', 303);
});

export default admin;

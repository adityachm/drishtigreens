import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { trimTrailingSlash } from 'hono/trailing-slash';
import admin from './admin/routes.tsx';
import { assetVersion, renderPage, turnstileKey, type AppEnv, type Ctx } from './env.ts';
import { loadSite } from './content/store.ts';
import { MEDIA_ID } from './lib/media.ts';
import { clientIp, verifyTurnstile } from './lib/util.ts';
import { sendEnquiryAlert } from './lib/alerts.ts';
import type { Site } from './views/site/parts.tsx';
import {
  AboutPage,
  ContactPage,
  HomePage,
  NotFoundPage,
  ProjectsPage,
  ServicePage,
  ServicesPage,
  type EnquiryValues,
} from './views/site/pages.tsx';

const app = new Hono<AppEnv>();

const PUBLIC_CSP =
  "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; " +
  "img-src 'self' data:; frame-src https://challenges.cloudflare.com; connect-src 'self'; " +
  "form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'";

app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return c.redirect(url.toString(), 301);
  }
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (url.protocol === 'https:') c.header('Strict-Transport-Security', 'max-age=31536000');
  if (!c.res.headers.has('Content-Security-Policy')) c.header('Content-Security-Policy', PUBLIC_CSP);
});

app.use('*', trimTrailingSlash());

app.route('/admin', admin);

// ---- Images from R2 ----

const MEDIA_FILE = /^(\d{1,4}\.(webp|jpg)|original\.(jpg|png|webp|gif|avif|heic|heif))$/;

app.get('/media/:id/:file', async (c) => {
  const { id, file } = c.req.param();
  if (!MEDIA_ID.test(id) || !MEDIA_FILE.test(file)) return c.notFound();
  const obj = await c.env.MEDIA.get(`media/${id}/${file}`, c.req.header('if-none-match'));
  if (!obj) return c.notFound();
  const headers = {
    'Content-Type': obj.contentType,
    ETag: obj.etag,
    // Each upload gets a new id, so a URL's content never changes.
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
  if (!obj.body) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers: { ...headers, 'Content-Length': String(obj.size) } });
});

app.get('/healthz', async (c) => {
  await c.env.DB.prepare('SELECT 1').first();
  return c.text('ok');
});

// ---- Public pages ----

async function site(c: Ctx): Promise<Site> {
  const { docs, media } = await loadSite(c.env.DB);
  const url = new URL(c.req.url);
  return { docs, media, v: assetVersion(c.env), path: url.pathname, origin: url.origin, turnstileKey: turnstileKey(c.env) };
}

async function html(c: Ctx, el: unknown, status: 200 | 400 | 404 = 200) {
  const res = await renderPage(c, el, status);
  // Admin edits must show up immediately, so pages are never served from a cache without checking.
  res.headers.set('Cache-Control', 'no-cache');
  return res;
}

app.get('/', async (c) => html(c, <HomePage site={await site(c)} />));
app.get('/about', async (c) => html(c, <AboutPage site={await site(c)} />));
app.get('/services', async (c) => html(c, <ServicesPage site={await site(c)} />));
app.get('/services/:slug', async (c) => {
  const s = await site(c);
  const service = s.docs.services.items.find((x) => x.visible && x.slug === c.req.param('slug'));
  if (!service) return html(c, <NotFoundPage site={s} />, 404);
  return html(c, <ServicePage site={s} service={service} />);
});
app.get('/projects', async (c) => html(c, <ProjectsPage site={await site(c)} category={c.req.query('category') ?? ''} />));

const EMPTY_ENQUIRY: EnquiryValues = { name: '', phone: '', email: '', city: '', project_type: '', message: '' };

app.get('/contact', async (c) =>
  html(c, <ContactPage site={await site(c)} sent={c.req.query('sent') === '1'} errors={[]} values={EMPTY_ENQUIRY} />),
);

app.post('/contact', async (c) => {
  const form = await c.req.formData();
  const get = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max);
  // Bots fill in the hidden "website" field; pretend it worked.
  if (get('website', 200)) return c.redirect('/contact?sent=1#enquiry', 303);

  const s = await site(c);
  const values: EnquiryValues = {
    name: get('name', 100),
    phone: get('phone', 30),
    email: get('email', 120),
    city: get('city', 80),
    project_type: get('project_type', 100),
    message: get('message', 3000),
  };
  const errors: string[] = [];
  if (!values.name) errors.push('Please enter your name.');
  if (values.phone.replace(/\D/g, '').length < 7) errors.push('Please enter a phone number we can call you on.');
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push('That email address does not look right.');
  if (values.project_type && !s.docs.contact.project_types.includes(values.project_type)) values.project_type = '';
  if (s.turnstileKey) {
    const ok = await verifyTurnstile(c.env.TURNSTILE_SECRET!, String(form.get('cf-turnstile-response') ?? ''), clientIp(c.req.raw.headers));
    if (!ok) errors.push('The security check failed. Please try again.');
  }
  if (errors.length) return html(c, <ContactPage site={s} sent={false} errors={errors} values={values} />, 400);

  const row = await c.env.DB.prepare(
    'INSERT INTO enquiries (name, phone, email, city, project_type, message) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
  )
    .bind(values.name, values.phone, values.email, values.city, values.project_type, values.message)
    .first<{ id: number }>();
  // Email the alert in the background so the visitor isn't kept waiting on the mail server.
  void sendEnquiryAlert(c.env, s.docs, { id: row!.id, ...values }, s.origin).catch((e) => console.error(e));
  return c.redirect('/contact?sent=1#enquiry', 303);
});

// ---- Search engines ----

app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin;
  return c.text(`User-agent: *\nDisallow: /admin\n\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get('/sitemap.xml', async (c) => {
  const s = await site(c);
  const paths = ['/', '/about', '/services', '/projects', '/contact', ...s.docs.services.items.filter((x) => x.visible).map((x) => `/services/${x.slug}`)];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((p) => `  <url><loc>${s.origin}${p}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
});

app.notFound(async (c) => {
  if (c.req.path.startsWith('/admin/api/') || c.req.path.startsWith('/media/')) return c.text('Not found', 404);
  return html(c, <NotFoundPage site={await site(c)} />, 404);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error(err);
  return c.text('Something went wrong. Please try again in a moment.', 500);
});

export default app;

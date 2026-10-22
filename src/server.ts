// Node entry point: opens the database (applying new migrations), serves /static from disk
// and hands everything else to the app.

import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import app from './index.tsx';
import type { Bindings } from './env.ts';
import { loadConfig } from './platform/config.ts';
import { migrate, openDb } from './platform/db.ts';
import { FileStorage } from './platform/storage.ts';
import { withForwardedProto } from './platform/http.ts';
import { mailerFromEnv } from './platform/smtp.ts';

const cfg = loadConfig();
const { db, raw } = openDb(join(cfg.dataDir, 'drishtigreens.sqlite'));
const applied = migrate(raw, cfg.migrationsDir);
if (applied.length) console.log(`Applied migrations: ${applied.join(', ')}`);

const env: Bindings = {
  DB: db,
  MEDIA: new FileStorage(join(cfg.dataDir, 'media')),
  VERSION: cfg.version,
  TURNSTILE_SITE_KEY: cfg.turnstileSiteKey,
  TURNSTILE_SECRET: cfg.turnstileSecret,
  MAILER: mailerFromEnv(cfg.get),
};
console.log(env.MAILER ? `Enquiry alerts send from ${env.MAILER.from}` : 'Enquiry alerts off (no SMTP_HOST)');

const root = new Hono<{ Bindings: Bindings }>();
// Pages link to /static files with ?v=<release>, so each release gets new URLs and long caching is safe.
root.use('/static/*', async (c, next) => {
  await next();
  if (c.res.status === 200) {
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    c.header('X-Content-Type-Options', 'nosniff');
  }
});
root.use('/static/*', serveStatic({ root: cfg.publicDir }));
root.route('/', app);

const server = serve({ fetch: (req) => root.fetch(withForwardedProto(req), env), port: cfg.port, hostname: cfg.host }, (info) =>
  console.log(`Drishti Greens ${cfg.version} listening on http://${info.address}:${info.port}`),
);

function shutdown() {
  server.close(() => {
    raw.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

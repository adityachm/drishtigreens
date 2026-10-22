import type { Context } from 'hono';
import type { Db } from './platform/db.ts';
import type { Storage } from './platform/storage.ts';
import type { Mailer } from './lib/mail.ts';

export type Bindings = {
  DB: Db;
  MEDIA: Storage;
  /** Short id of the running release, appended to /static URLs so each release busts caches. */
  VERSION: string;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET: string;
  /** Sends enquiry alerts; null when SMTP isn't configured. */
  MAILER: Mailer | null;
};

export type AppEnv = { Bindings: Bindings };
export type Ctx = Context<AppEnv>;

export function assetVersion(env: Bindings): string {
  return env.VERSION || 'dev';
}

/** Turnstile is on only when both the site key and the secret are configured. */
export function turnstileKey(env: Bindings): string {
  return env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET ? env.TURNSTILE_SITE_KEY : '';
}

export async function renderPage(c: Ctx, el: unknown, status: 200 | 400 | 404 | 429 | 500 = 200): Promise<Response> {
  const body = await (el as Promise<string> | string);
  return c.html('<!doctype html>' + String(body), status);
}

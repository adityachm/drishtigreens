import type { Context } from 'hono';

export type Bindings = Env & {
  /** Turnstile secret, set with `wrangler secret put TURNSTILE_SECRET`. Optional. */
  TURNSTILE_SECRET?: string;
};

export type AppEnv = { Bindings: Bindings };
export type Ctx = Context<AppEnv>;

/** Short id of the running deployment, appended to /static URLs so each release busts caches. */
export function assetVersion(env: Bindings): string {
  return env.CF_VERSION_METADATA?.id?.slice(0, 8) || 'dev';
}

/** Turnstile is on only when both the site key and the secret are configured. */
export function turnstileKey(env: Bindings): string {
  return env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET ? env.TURNSTILE_SITE_KEY : '';
}

export async function renderPage(c: Ctx, el: unknown, status: 200 | 400 | 404 | 429 | 500 = 200): Promise<Response> {
  const body = await (el as Promise<string> | string);
  return c.html('<!doctype html>' + String(body), status);
}

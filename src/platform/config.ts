// Settings from the environment, plus an optional KEY=VALUE file (ENV_FILE) for secrets.
// The file is read here rather than by Docker Compose, so a "$" in a secret is kept as typed.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type Config = {
  dataDir: string;
  port: number;
  host: string;
  version: string;
  publicDir: string;
  migrationsDir: string;
  turnstileSiteKey: string;
  turnstileSecret: string;
};

export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2];
    if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const file = env.ENV_FILE ? parseEnvFile(readFileSync(env.ENV_FILE, 'utf8')) : {};
  const get = (k: string, d = '') => env[k] ?? file[k] ?? d;
  return {
    dataDir: resolve(get('DATA_DIR', './data')),
    port: Number(get('PORT', '8787')),
    host: get('HOST', '0.0.0.0'),
    version: get('APP_VERSION', 'dev').slice(0, 12),
    publicDir: get('PUBLIC_DIR', './public'),
    migrationsDir: resolve(get('MIGRATIONS_DIR', './migrations')),
    turnstileSiteKey: get('TURNSTILE_SITE_KEY'),
    turnstileSecret: get('TURNSTILE_SECRET'),
  };
}

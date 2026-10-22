import type { Db } from '../platform/db.ts';
import { verifyPassword } from './password.ts';

export const SESSION_COOKIE = 'dg_admin';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const MAX_FAILURES = 5;
const FAILURE_WINDOW_SECONDS = 15 * 60;
const LOCKOUT_SECONDS = 15 * 60;

const now = () => Math.floor(Date.now() / 1000);

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function hasAdminPassword(db: Db): Promise<boolean> {
  return (await db.prepare('SELECT 1 FROM admin_user WHERE id = 1').first()) !== null;
}

export async function checkPassword(db: Db, password: string): Promise<boolean> {
  const row = await db.prepare('SELECT password_hash FROM admin_user WHERE id = 1').first<{ password_hash: string }>();
  if (!row) return false;
  return verifyPassword(password, row.password_hash);
}

export async function setPasswordHash(db: Db, hash: string): Promise<void> {
  await db.batch([
    db
      .prepare(
        `INSERT INTO admin_user (id, password_hash, updated_at) VALUES (1, ?, datetime('now'))
         ON CONFLICT (id) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at`,
      )
      .bind(hash),
    db.prepare('DELETE FROM sessions'),
  ]);
}

/** Creates a session and returns the raw token for the cookie. Only its hash is stored. */
export async function createSession(db: Db): Promise<string> {
  const token = randomToken();
  const t = now();
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(t),
    db
      .prepare('INSERT INTO sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)')
      .bind(await sha256Hex(token), t, t + SESSION_TTL_SECONDS),
  ]);
  return token;
}

export async function isValidSession(db: Db, token: string | undefined): Promise<boolean> {
  if (!token || token.length > 100) return false;
  const row = await db
    .prepare('SELECT expires_at FROM sessions WHERE token_hash = ?')
    .bind(await sha256Hex(token))
    .first<{ expires_at: number }>();
  return row !== null && row.expires_at > now();
}

export async function destroySession(db: Db, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
}

/** Seconds until this IP may try again, or 0 if it is not locked out. */
export async function lockoutRemaining(db: Db, ip: string): Promise<number> {
  const row = await db
    .prepare('SELECT locked_until FROM login_attempts WHERE ip = ?')
    .bind(ip)
    .first<{ locked_until: number }>();
  return row ? Math.max(0, row.locked_until - now()) : 0;
}

export async function recordFailure(db: Db, ip: string): Promise<void> {
  const t = now();
  // Start a fresh window if the last one expired; lock once failures reach the limit.
  await db
    .prepare(
      `INSERT INTO login_attempts (ip, failures, window_start, locked_until) VALUES (?1, 1, ?2, 0)
       ON CONFLICT (ip) DO UPDATE SET
         failures = CASE WHEN window_start < ?2 - ?3 THEN 1 ELSE failures + 1 END,
         window_start = CASE WHEN window_start < ?2 - ?3 THEN ?2 ELSE window_start END,
         locked_until = CASE WHEN window_start >= ?2 - ?3 AND failures + 1 >= ?4 THEN ?2 + ?5 ELSE locked_until END`,
    )
    .bind(ip, t, FAILURE_WINDOW_SECONDS, MAX_FAILURES, LOCKOUT_SECONDS)
    .run();
}

export async function clearFailures(db: Db, ip: string): Promise<void> {
  await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
}

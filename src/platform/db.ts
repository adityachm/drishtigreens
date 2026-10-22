// SQLite through Node's built-in node:sqlite, behind a small async API
// (prepare → bind → first/all/run, plus batch in one transaction).

import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ changes: number }>;
}

export interface Db {
  prepare(sql: string): Statement;
  /** Runs every statement in one transaction; returns rows for queries and [] for writes. */
  batch(statements: Statement[]): Promise<{ results: unknown[] }[]>;
}

function toSql(v: unknown): SQLInputValue {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'bigint' || v instanceof Uint8Array) return v;
  throw new TypeError(`Cannot bind a ${typeof v} to SQL`);
}

class SqliteStatement implements Statement {
  readonly db: DatabaseSync;
  readonly sql: string;
  readonly params: SQLInputValue[];

  constructor(db: DatabaseSync, sql: string, params: SQLInputValue[] = []) {
    this.db = db;
    this.sql = sql;
    this.params = params;
  }

  bind(...values: unknown[]): Statement {
    return new SqliteStatement(this.db, this.sql, values.map(toSql));
  }

  firstSync<T>(): T | null {
    return (this.db.prepare(this.sql).get(...this.params) as T | undefined) ?? null;
  }

  allSync<T>(): T[] {
    return this.db.prepare(this.sql).all(...this.params) as T[];
  }

  runSync(): { changes: number } {
    return { changes: Number(this.db.prepare(this.sql).run(...this.params).changes) };
  }

  isQuery(): boolean {
    return this.db.prepare(this.sql).columns().length > 0;
  }

  async first<T>(): Promise<T | null> {
    return this.firstSync<T>();
  }

  async all<T>(): Promise<{ results: T[] }> {
    return { results: this.allSync<T>() };
  }

  async run(): Promise<{ changes: number }> {
    return this.runSync();
  }
}

export function openDb(path: string): { db: Db; raw: DatabaseSync } {
  const raw = new DatabaseSync(path);
  raw.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  const db: Db = {
    prepare: (sql) => new SqliteStatement(raw, sql),
    async batch(statements) {
      raw.exec('BEGIN');
      try {
        const out = statements.map((s) => {
          const st = s as SqliteStatement;
          if (st.isQuery()) return { results: st.allSync() };
          st.runSync();
          return { results: [] };
        });
        raw.exec('COMMIT');
        return out;
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return { db, raw };
}

/** Applies migrations/*.sql not yet recorded in the migrations table, in name order. Returns their names. */
export function migrate(raw: DatabaseSync, dir: string): string[] {
  raw.exec('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
  const done = new Set((raw.prepare('SELECT name FROM migrations').all() as { name: string }[]).map((r) => r.name));
  const pending = readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !done.has(f))
    .sort();
  for (const name of pending) {
    raw.exec('BEGIN');
    try {
      raw.exec(readFileSync(join(dir, name), 'utf8'));
      raw.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
      raw.exec('COMMIT');
    } catch (e) {
      raw.exec('ROLLBACK');
      throw new Error(`Migration ${name} failed: ${(e as Error).message}`);
    }
  }
  return pending;
}

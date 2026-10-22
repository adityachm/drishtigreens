import { DEFAULTS } from './defaults.ts';
import type { DocKey, Docs } from './schema.ts';
import { mediaQuery, toMediaMap, type MediaMap } from '../lib/media.ts';

type ContentRow = { key: string; value: string };

/** Stored documents over defaults, so fields added in code later still have values. */
export function mergeDocs(rows: ContentRow[]): Docs {
  const docs = structuredClone(DEFAULTS);
  for (const row of rows) {
    if (!(row.key in docs)) continue;
    const key = row.key as DocKey;
    try {
      Object.assign(docs[key], JSON.parse(row.value));
    } catch {
      // A corrupt row keeps the defaults rather than taking the site down.
    }
  }
  return docs;
}

export async function loadDocs(db: D1Database): Promise<Docs> {
  const { results } = await db.prepare('SELECT key, value FROM content').all<ContentRow>();
  return mergeDocs(results);
}

/** Content and media in one round trip, for rendering public pages. */
export async function loadSite(db: D1Database): Promise<{ docs: Docs; media: MediaMap }> {
  const [content, media] = await db.batch([db.prepare('SELECT key, value FROM content'), mediaQuery(db)]);
  return {
    docs: mergeDocs(content.results as ContentRow[]),
    media: toMediaMap(media.results as Parameters<typeof toMediaMap>[0]),
  };
}

export async function saveDoc(db: D1Database, key: DocKey, value: unknown): Promise<void> {
  await db
    .prepare(
      `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(key, JSON.stringify(value))
    .run();
}

import type { Db } from '../platform/db.ts';

export type Media = {
  id: string;
  alt: string;
  width: number;
  height: number;
  ext: 'webp' | 'jpg';
  widths: number[];
  original_key: string | null;
  original_name: string | null;
  bytes: number;
  created_at: string;
};

export type MediaMap = Map<string, Media>;

export const MEDIA_ID = /^[a-z0-9-]{1,64}$/;
/** Target widths for resized copies; images are never upscaled. */
export const VARIANT_WIDTHS = [480, 960, 1600];
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
export const MAX_VARIANT_BYTES = 6 * 1024 * 1024;

type MediaRow = Omit<Media, 'widths'> & { widths: string };

export function rowToMedia(r: MediaRow): Media {
  return { ...r, widths: JSON.parse(r.widths) as number[] };
}

export function mediaQuery(db: Db) {
  return db.prepare('SELECT * FROM media ORDER BY created_at DESC, id');
}

export function toMediaMap(rows: MediaRow[]): MediaMap {
  return new Map(rows.map((r) => [r.id, rowToMedia(r)]));
}

export function variantUrl(m: Media, width: number): string {
  return `/media/${m.id}/${width}.${m.ext}`;
}

/** The smallest stored copy at least `min` px wide, falling back to the largest. */
export function urlAtLeast(m: Media, min: number): string {
  const w = m.widths.find((x) => x >= min) ?? m.widths[m.widths.length - 1];
  return variantUrl(m, w);
}

export function srcset(m: Media): string {
  return m.widths.map((w) => `${variantUrl(m, w)} ${w}w`).join(', ');
}

/** True if any content document refers to this media id. */
export function isReferenced(docs: unknown, id: string): boolean {
  return JSON.stringify(docs).includes(`"${id}"`);
}

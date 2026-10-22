// Photo files on local disk. Keys look like media/<id>/<file>; every key is checked to stay
// inside the storage folder. Writes go to a temporary file first, so a reader never sees half a photo.

import { createReadStream } from 'node:fs';
import { mkdir, readdir, rename, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';

export interface StoredObject {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  etag: string;
  size: number;
}

export interface Storage {
  put(key: string, data: Blob): Promise<void>;
  /** The object's metadata, plus its body unless the etag matches `ifNoneMatch`. */
  get(key: string, ifNoneMatch?: string | null): Promise<(Omit<StoredObject, 'body'> & { body: ReadableStream<Uint8Array> | null }) | null>;
  /** Keys under a folder prefix such as `media/<id>/`. */
  list(prefix: string): Promise<string[]>;
  delete(keys: string[]): Promise<void>;
}

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
};

const KEY = /^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)*\/?$/;

export class FileStorage implements Storage {
  readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private path(key: string): string {
    if (!KEY.test(key) || key.split('/').some((p) => p === '..' || p === '.')) throw new Error(`Invalid storage key: ${key}`);
    const p = resolve(this.root, key);
    if (p !== this.root && !p.startsWith(this.root + sep)) throw new Error(`Invalid storage key: ${key}`);
    return p;
  }

  async put(key: string, data: Blob): Promise<void> {
    const p = this.path(key);
    await mkdir(dirname(p), { recursive: true });
    const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, new Uint8Array(await data.arrayBuffer()));
    await rename(tmp, p);
  }

  async get(key: string, ifNoneMatch?: string | null) {
    const p = this.path(key);
    const s = await stat(p).catch(() => null);
    if (!s?.isFile()) return null;
    const etag = `"${s.size.toString(36)}-${Math.floor(s.mtimeMs).toString(36)}"`;
    const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
    const meta = { contentType: TYPES[ext] ?? 'application/octet-stream', etag, size: s.size };
    if (ifNoneMatch && ifNoneMatch === etag) return { ...meta, body: null };
    return { ...meta, body: Readable.toWeb(createReadStream(p)) as ReadableStream<Uint8Array> };
  }

  async list(prefix: string): Promise<string[]> {
    const dir = this.path(prefix);
    const names = await readdir(dir).catch(() => [] as string[]);
    const base = prefix.endsWith('/') ? prefix : prefix + '/';
    return names.filter((n) => !n.endsWith('.tmp')).map((n) => base + n);
  }

  async delete(keys: string[]): Promise<void> {
    const dirs = new Set<string>();
    for (const k of keys) {
      const p = this.path(k);
      await rm(p, { force: true });
      dirs.add(dirname(p));
    }
    // Remove folders left empty, but never the storage root itself.
    for (const d of dirs) if (d !== this.root) await rmdir(d).catch(() => {});
  }
}

// Loads the client's 15 project photos as `seed-01` … `seed-15`, the ids the default content
// refers to, into a data folder (database + media). Safe to run again; it overwrites the same ids.
//   npm run seed                                   # into ./data
//   DATA_DIR=/some/folder npm run seed -- <photos> # elsewhere, e.g. to prepare the server's data
// The photos folder defaults to ../Drishti_Greens_Website_Photos_Named (files named NN_description.jpg).

import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { migrate, openDb } from '../src/platform/db.ts';
import { FileStorage } from '../src/platform/storage.ts';

const WIDTHS = [480, 960, 1600];

const ALT: Record<string, string> = {
  '01': 'Villa garden pathway with stone stepping slabs, dark pebbles and tropical planting',
  '02': 'Public park with a circular lawn, curving pathways and layered planting',
  '03': 'Curved paved walkway between carefully edged planting beds in a park',
  '04': 'Public garden with contrasting foliage beds under mature shade trees',
  '05': 'Vertical garden wall in a compact residential courtyard with a lawn and stepping stones',
  '06': 'Lawn framed by tall coconut palms, clipped shrubs and grey stepping stones',
  '07': 'Manicured lawn with ornamental borders and a garden pergola',
  '08': 'Residential garden with layered planting, a healthy lawn and a green wall',
  '09': 'Straight stone walkway with symmetrical tropical planting on both sides',
  '10': 'Garden at night with lit pathways, lawn and conical shrubs',
  '11': 'Mature tree prepared for relocation beside sculpted topiary',
  '12': 'Nursery rows of established trees ready for planting',
  '13': 'Team loading a mature tree with its root ball onto a truck',
  '14': 'Row of tall mature palms',
  '15': 'Sculpted topiary and specimen plants in a nursery',
};

const dataDir = resolve(process.env.DATA_DIR ?? './data');
const photos = resolve(process.argv[2] ?? '../Drishti_Greens_Website_Photos_Named');
mkdirSync(dataDir, { recursive: true });

const { db, raw } = openDb(join(dataDir, 'drishtigreens.sqlite'));
migrate(raw, resolve('migrations'));
const storage = new FileStorage(join(dataDir, 'media'));

const files = readdirSync(photos)
  .filter((f) => /^\d{2}_.+\.jpe?g$/i.test(f))
  .sort();
if (!files.length) {
  console.error(`No NN_name.jpg photos found in ${photos}`);
  process.exit(1);
}

for (const file of files) {
  const nn = file.slice(0, 2);
  const id = `seed-${nn}`;
  const src = join(photos, file);
  const { info } = await sharp(src).rotate().toBuffer({ resolveWithObject: true });
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, info.width)))];
  for (const w of widths) {
    const buf = await sharp(src).rotate().resize({ width: w }).webp({ quality: 78 }).toBuffer();
    await storage.put(`media/${id}/${w}.webp`, new Blob([new Uint8Array(buf)]));
  }
  const original = readFileSync(src);
  await storage.put(`media/${id}/original.jpg`, new Blob([new Uint8Array(original)]));
  await db
    .prepare(
      `INSERT OR REPLACE INTO media (id, alt, width, height, ext, widths, original_key, original_name, bytes)
       VALUES (?, ?, ?, ?, 'webp', ?, ?, ?, ?)`,
    )
    .bind(id, ALT[nn] ?? file.slice(3).replace(/\.\w+$/, '').replace(/_/g, ' '), info.width, info.height, JSON.stringify(widths), `media/${id}/original.jpg`, file, original.length)
    .run();
  console.log(`${id}  ${file}  ${info.width}×${info.height} → ${widths.join(', ')}px`);
}
raw.close();
console.log(`\nSeeded ${files.length} photos into ${dataDir}`);

// Loads the client's 15 project photos into R2 and the media table as `seed-01` … `seed-15`,
// the ids the default content refers to. Safe to run again; it overwrites the same ids.
//   npm run seed:local  [-- <photos folder>]
//   npm run seed:remote [-- <photos folder>]
// The folder defaults to ../Drishti_Greens_Website_Photos_Named (files named NN_description.jpg).

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WIDTHS = [480, 960, 1600];
const BUCKET = 'drishtigreens-media';

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

const args = process.argv.slice(2);
const target = args.includes('--remote') ? '--remote' : args.includes('--local') ? '--local' : '';
if (!target) {
  console.error('Usage: node scripts/seed-media.ts --local | --remote [photos folder]');
  process.exit(1);
}
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const photos = resolve(root, args.find((a) => !a.startsWith('--')) ?? '../Drishti_Greens_Website_Photos_Named');
const tmp = join(here, '.seed-tmp');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

function wrangler(...a: string[]) {
  execFileSync('npx', ['wrangler', ...a], { stdio: ['ignore', 'ignore', 'inherit'], cwd: root });
}

const files = readdirSync(photos)
  .filter((f) => /^\d{2}_.+\.jpe?g$/i.test(f))
  .sort();
if (!files.length) {
  console.error(`No NN_name.jpg photos found in ${photos}`);
  process.exit(1);
}

const rows: string[] = [];
for (const file of files) {
  const nn = file.slice(0, 2);
  const id = `seed-${nn}`;
  const src = join(photos, file);
  const { info } = await sharp(src).rotate().toBuffer({ resolveWithObject: true });
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, info.width)))];
  process.stdout.write(`${id}  ${file}  ${info.width}×${info.height} → ${widths.join(', ')}px … `);

  for (const w of widths) {
    const out = join(tmp, `${id}-${w}.webp`);
    await sharp(src).rotate().resize({ width: w }).webp({ quality: 78 }).toFile(out);
    wrangler('r2', 'object', 'put', `${BUCKET}/media/${id}/${w}.webp`, '--file', out, '--content-type', 'image/webp', target);
  }
  wrangler('r2', 'object', 'put', `${BUCKET}/media/${id}/original.jpg`, '--file', src, '--content-type', 'image/jpeg', target);

  const alt = (ALT[nn] ?? file.slice(3).replace(/\.\w+$/, '').replace(/_/g, ' ')).replace(/'/g, "''");
  const name = file.replace(/'/g, "''");
  rows.push(
    `INSERT OR REPLACE INTO media (id, alt, width, height, ext, widths, original_key, original_name, bytes) ` +
      `VALUES ('${id}', '${alt}', ${info.width}, ${info.height}, 'webp', '${JSON.stringify(widths)}', 'media/${id}/original.jpg', '${name}', 0);`,
  );
  console.log('done');
}

const sqlFile = join(tmp, 'seed.sql');
writeFileSync(sqlFile, rows.join('\n') + '\n');
wrangler('d1', 'execute', 'drishtigreens', target, '--yes', '--file', sqlFile);
rmSync(tmp, { recursive: true, force: true });
console.log(`\nSeeded ${files.length} photos (${target.slice(2)}).`);

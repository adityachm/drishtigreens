// Maintenance commands, run inside the app image (or locally after `npm run build`):
//   node dist/manage.js migrate
//   node dist/manage.js set-password          (asks for the password; needs a terminal)
//   node dist/manage.js backup --dir <folder> [--keep-days 14]

import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from './platform/config.ts';
import { migrate, openDb } from './platform/db.ts';
import { hashPassword, MIN_PASSWORD_LENGTH } from './lib/password.ts';
import { setPasswordHash } from './lib/auth.ts';

const cfg = loadConfig();
const [cmd, ...args] = process.argv.slice(2);
const opt = (name: string, d?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : d;
};

function askHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY) {
    console.error('Run this in a terminal so the password can be typed without showing it.');
    process.exit(1);
  }
  process.stdout.write(question);
  return new Promise((resolve) => {
    let input = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(input);
          return;
        }
        if (ch === '\u0003') {
          stdin.setRawMode(false);
          process.stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') input = input.slice(0, -1);
        else input += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const { db, raw } = openDb(join(cfg.dataDir, 'drishtigreens.sqlite'));

switch (cmd) {
  case 'migrate': {
    const applied = migrate(raw, cfg.migrationsDir);
    console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
    break;
  }
  case 'set-password': {
    migrate(raw, cfg.migrationsDir);
    const password = await askHidden('New admin password: ');
    if (password.length < MIN_PASSWORD_LENGTH) {
      console.error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      process.exit(1);
    }
    if ((await askHidden('Repeat it: ')) !== password) {
      console.error('The passwords do not match.');
      process.exit(1);
    }
    await setPasswordHash(db, await hashPassword(password));
    console.log('Admin password set. Every existing admin session has been signed out.');
    break;
  }
  case 'backup': {
    const dir = opt('dir');
    const keepDays = Number(opt('keep-days', '14'));
    if (!dir) throw new Error('backup needs --dir <folder>');
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
    const file = join(dir, `drishtigreens-${stamp}.sqlite`);
    // VACUUM INTO writes a consistent copy while the site keeps running.
    raw.prepare('VACUUM INTO ?').run(file);
    console.log(`Backed up to ${file}`);
    const cutoff = Date.now() - keepDays * 86_400_000;
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (/^drishtigreens-\d{8}-\d{6}\.sqlite$/.test(f) && statSync(p).mtimeMs < cutoff) unlinkSync(p);
    }
    break;
  }
  default:
    console.error('Usage: manage.js migrate | set-password | backup --dir <folder> [--keep-days N]');
    process.exit(1);
}
raw.close();

// Sets (or resets) the admin password. The password is hashed here and only the hash is sent to D1.
//   npm run set-password:local    # for `npm run dev`
//   npm run set-password:remote   # for the live site
// Setting a password signs out every existing admin session.

import { execFileSync } from 'node:child_process';
import { hashPassword, MIN_PASSWORD_LENGTH } from '../src/lib/password.ts';

const target = process.argv.includes('--remote') ? '--remote' : process.argv.includes('--local') ? '--local' : '';
if (!target) {
  console.error('Usage: node scripts/set-password.ts --local | --remote');
  process.exit(1);
}

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

const password = await askHidden('New admin password: ');
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}
if ((await askHidden('Repeat it: ')) !== password) {
  console.error('The passwords do not match.');
  process.exit(1);
}

const hash = await hashPassword(password);
// The hash contains only base64 characters, digits and "$", so it is safe inside the SQL string.
if (!/^[A-Za-z0-9$+/=-]+$/.test(hash)) throw new Error('Unexpected hash format');

const sql =
  `INSERT INTO admin_user (id, password_hash, updated_at) VALUES (1, '${hash}', datetime('now')) ` +
  `ON CONFLICT (id) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at; ` +
  `DELETE FROM sessions;`;

execFileSync('npx', ['wrangler', 'd1', 'execute', 'drishtigreens', target, '--yes', '--command', sql], { stdio: 'inherit' });
console.log(`\nAdmin password set (${target.slice(2)}). Sign in at /admin.`);

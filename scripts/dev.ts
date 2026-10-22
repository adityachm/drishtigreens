// Local development: rebuilds dist/ on every change and restarts the server.
//   npm run dev   → http://localhost:8787 (data in ./data)

import { spawn } from 'node:child_process';
import { context } from 'esbuild';

const ctx = await context({
  entryPoints: ['src/server.ts', 'src/manage.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  outdir: 'dist',
  logLevel: 'info',
});
await ctx.rebuild();
await ctx.watch();

const server = spawn(process.execPath, ['--watch', '--disable-warning=ExperimentalWarning', 'dist/server.js'], {
  stdio: 'inherit',
  env: { DATA_DIR: './data', PORT: '8787', HOST: '127.0.0.1', ...process.env },
});
const stop = () => {
  server.kill();
  void ctx.dispose().then(() => process.exit(0));
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

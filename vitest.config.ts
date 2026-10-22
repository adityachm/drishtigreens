import { defineConfig } from 'vitest/config';

// JSX settings come from tsconfig.json (hono/jsx).
export default defineConfig({
  test: { include: ['test/**/*.test.{ts,tsx}'] },
});

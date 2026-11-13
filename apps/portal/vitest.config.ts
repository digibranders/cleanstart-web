// vitest.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    globalSetup: ['./src/db/test-global-setup.ts'],
    setupFiles: ['./src/db/test-setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { maxForks: 4, minForks: 1 } },
    fileParallelism: true,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});

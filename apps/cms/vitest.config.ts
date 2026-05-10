import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    globals: false,
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/payload/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__snapshots__/**',
        'src/payload/admin/**',
        'src/payload/payload-types.ts',
      ],
      thresholds: {
        lines: 35,
        statements: 35,
        functions: 50,
        branches: 60,
      },
    },
  },
});

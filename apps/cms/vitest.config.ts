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
        // Global floor — set below the measured baseline (≈68/82/70/68 as of
        // 2026-06) so routine changes don't trip the gate, but regressions do.
        lines: 60,
        statements: 60,
        functions: 65,
        branches: 78,
        // Per-directory floors on the security- and lead-loss-critical paths.
        // These are near-fully covered and must stay that way: a drop here is
        // a silent authz / GDPR / lead-pipeline regression.
        'src/payload/access/**/*.ts': {
          lines: 95,
          statements: 95,
          functions: 95,
          branches: 90,
        },
        // Scoped to the credential-resolution + encryption + cache + router
        // core. The kind adapters under integrations/kinds/ are external-API
        // clients (GA4/GSC/Clarity) held to the global floor for now.
        'src/payload/lib/integrations/{credentials,secrets,cache,router}.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 85,
        },
        'src/payload/lib/lead-handlers/**/*.ts': {
          lines: 85,
          statements: 85,
          functions: 78,
          branches: 80,
        },
      },
    },
  },
});

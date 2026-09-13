import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/__tests__/**',
        // Workers entry: route wiring only, exercised via deployed smoke tests.
        'src/worker.ts',
        // Type/interface-only modules and barrel re-exports: no runtime logic.
        'src/types.ts',
        'src/lib/order-intake/types.ts',
        'src/lib/cache/cache-repository.ts',
        'src/lib/repositories/index.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
});

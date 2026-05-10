import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/server.ts'],
      thresholds: {
        lines: 80,
        branches: 90,
      },
    },
    snapshotFormat: {
      escapeString: false,
      printBasicPrototype: false,
    },
  },
});

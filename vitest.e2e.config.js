import { defineConfig } from 'vitest/config';

// Browser tests run one at a time against a single Chrome instance.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test-e2e/**/*.e2e.test.js'],
    testTimeout: 60000,
    hookTimeout: 120000,
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});

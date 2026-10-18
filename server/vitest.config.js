import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.js'],
    testTimeout: 60000,
    hookTimeout: 300000
  }
});

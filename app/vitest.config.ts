import path from 'node:path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src'),
      '@design': path.resolve(__dirname, '../design'),
      '@shared/types': path.resolve(__dirname, '../packages/shared-types/src/index.ts'),
      '@messages': path.resolve(__dirname, 'messages'),
    },
  },
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});

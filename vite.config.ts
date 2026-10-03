import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import pkg from './package.json' with { type: 'json' };

// Every peer dependency stays external, including subpath imports (`react/jsx-runtime`,
// `@mui/material/styles`) — a plain string only matches the bare specifier and would bundle them.
const external = Object.keys(pkg.peerDependencies).map(
  (name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(/|$)`),
);

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.stories.ts',
        'src/**/*.stories.tsx',
        'src/stories',
        'src/test',
      ],
      bundleTypes: true,
    }),
  ],
  resolve: {
    alias: {
      '@components': resolve(import.meta.dirname, 'src/components'),
      '@contexts': resolve(import.meta.dirname, 'src/contexts'),
      '@hooks': resolve(import.meta.dirname, 'src/hooks'),
      '@lib': resolve(import.meta.dirname, 'src/lib'),
      '@providers': resolve(import.meta.dirname, 'src/providers'),
      '@types': resolve(import.meta.dirname, 'src/types'),
    },
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    sourcemap: true,
    rolldownOptions: {
      external,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

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
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@mui/material',
        '@mui/system',
        '@mui/x-data-grid',
        '@emotion/react',
        '@emotion/styled',
      ],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});

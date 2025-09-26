// tsup.config.js
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'jotai'],
  // CSS modules dosyalarını çıktı klasörüne kopyala
  loader: { '.css': 'copy' },
  target: 'es2019',
  outDir: 'dist'
});

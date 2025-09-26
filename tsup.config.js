// tsup.config.js
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.js',
    'src/utils/*.js',
    'src/context/*.js',
    'src/context/*.native.jsx',
    'src/context/*.web.jsx',
  ],

  format: ['esm', 'cjs'],
  /** 🔑  Kod bölme = paylaşılan tek kopya */
  splitting: true,          // ←  default zaten true; önemli olan **false** olmaması
  treeshake: true,
  sourcemap: true,
  clean: true,
  target: 'esnext',
  platform: 'neutral',
  outDir: 'dist',

  /** (İsteğe bağlı) Bildirim dosyaları ve küçültme
  dts: true,
  minify: true,
  */

  esbuildOptions(options) {
    options.resolveExtensions = [
      '.native.jsx', '.web.jsx', '.jsx', '.js', '.json',
    ];
  },

  external: [
    'react', 'react-dom', 'react-native',
    'react-router-dom', 'react-hot-toast',
    'expo-secure-store',
  ],
});

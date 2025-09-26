import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'CtrlcanOrbit',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'orbit.esm.js' : 'orbit.cjs')
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' }
      }
    },
    sourcemap: true
  }
});

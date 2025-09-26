import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ctrlcan/orbit': path.resolve(__dirname, '../../src/index.js')
    }
  }
});

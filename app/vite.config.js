import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O build gera index.html + assets/ na raiz do repositório,
// para o GitHub Pages continuar em "Deploy from a branch · main · /(root)".
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '..',
    emptyOutDir: false,
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1200,
  },
});

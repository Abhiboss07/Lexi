import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

// Generates dist/404.html from dist/index.html to support SPA routing on GitHub Pages
function githubPagesSpaFallback() {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexPath = path.resolve(distDir, 'index.html');
      const fallbackPath = path.resolve(distDir, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, fallbackPath);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Lexi/' : '/'),
  plugins: [
    react(),
    tailwindcss(),
    githubPagesSpaFallback(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('dexie')) {
              return 'vendor-dexie';
            }
            if (id.includes('ts-fsrs')) {
              return 'vendor-fsrs';
            }
            if (id.includes('canvas-confetti')) {
              return 'vendor-confetti';
            }
          }
          if (id.includes('/src/data/curriculum/')) {
            return 'curriculum-core';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});

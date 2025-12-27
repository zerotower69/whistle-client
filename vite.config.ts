import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'move-and-fix-html-files',
      closeBundle() {
        // Move HTML files to the correct location and fix asset paths
        const publicDir = resolve(__dirname, 'public');
        const openHtmlSrc = resolve(publicDir, 'pages/open/index.html');
        const openHtmlDest = resolve(publicDir, 'open.html');
        const settingsHtmlSrc = resolve(publicDir, 'pages/settings/index.html');
        const settingsHtmlDest = resolve(publicDir, 'settings.html');

        // Process open.html
        if (fs.existsSync(openHtmlSrc)) {
          let content = fs.readFileSync(openHtmlSrc, 'utf-8');
          // Convert absolute paths to relative paths
          content = content.replace(/src="\/assets\//g, 'src="./assets/');
          content = content.replace(/href="\/assets\//g, 'href="./assets/');
          fs.writeFileSync(openHtmlDest, content);
        }

        // Process settings.html
        if (fs.existsSync(settingsHtmlSrc)) {
          let content = fs.readFileSync(settingsHtmlSrc, 'utf-8');
          // Convert absolute paths to relative paths
          content = content.replace(/src="\/assets\//g, 'src="./assets/');
          content = content.replace(/href="\/assets\//g, 'href="./assets/');
          fs.writeFileSync(settingsHtmlDest, content);
        }
      },
    },
  ],
  root: 'src',
  publicDir: '../assets',
  resolve: {
    alias: {
      '~imgPath': resolve(__dirname, 'assets/images'),
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        open: resolve(__dirname, 'src/pages/open/index.html'),
        settings: resolve(__dirname, 'src/pages/settings/index.html'),
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});

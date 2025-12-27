import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'build/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.js'),
          whistle: resolve(__dirname, 'src/main/whistle.js'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === 'whistle' ? 'chunks/[name].js' : '[name].js';
          },
          chunkFileNames: 'chunks/[name]-[hash].js',
        },
      },
    },
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
      },
    },
    build: {
      outDir: 'build/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/src/index.html'),
          open: resolve(__dirname, 'src/renderer/pages/open/index.html'),
          settings: resolve(__dirname, 'src/renderer/pages/settings/index.html'),
          plugins: resolve(__dirname, 'src/renderer/pages/plugins/index.html'),
        },
      },
    },
    server: {
      // proxy: {
      //   '/cgi-bin': 'http://127.0.0.1:8899',
      //   '/plugin': 'http://127.0.0.1:8899',
      //   '/img': 'http://127.0.0.1:8899',
      // },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Read API key from environment variable
const STABILITY_API_KEY = process.env.VITE_STABILITY_API_KEY;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/shortslab/', // Ensure this matches your repository name
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/api/tts': {
        target: 'https://translate.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, '/translate_tts'),
        headers: {
          'Referer': 'https://translate.google.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  build: {
    outDir: 'dist',
    assetsDir: '', // Remove the assets subdirectory
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
        },
        // Ensure assets are placed in the root of dist
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      }
    }
  },
  assetsInclude: ['**/*.wasm']
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { resolve } from 'path';

// Read API key from environment variable

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'configure-response-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Cross-Origin-Isolation', 'require-corp');
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Cross-Origin-Isolation', 'require-corp');
          next();
        });
      },
      writeBundle() {
        // Create .nojekyll file
        fs.writeFileSync(path.join('dist', '.nojekyll'), '');
        
        // Create _headers file for GitHub Pages
        const headersContent = `/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: cross-origin
  Cross-Origin-Isolation: require-corp
  Cache-Control: public, max-age=31536000
  
/*.js
  Content-Type: application/javascript
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: cross-origin
  Cross-Origin-Isolation: require-corp

/*.wasm
  Content-Type: application/wasm
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: cross-origin
  Cross-Origin-Isolation: require-corp

/sw.js
  Content-Type: application/javascript
  Cache-Control: no-cache, no-store, must-revalidate`;
        fs.writeFileSync(path.join('dist', '_headers'), headersContent);
        
        // Create a GitHub specific CNAME file if needed
        fs.writeFileSync(path.join('dist', 'CNAME'), 'shorts.forcreator.space');
        
        // Copy the service worker and 404.html to the dist folder
        try {
          if (fs.existsSync('public/sw.js')) {
            fs.copyFileSync('public/sw.js', path.join('dist', 'sw.js'));
            console.log('Copied sw.js to dist folder');
          } else {
            console.error('sw.js not found in public folder!');
          }
          
          if (fs.existsSync('public/404.html')) {
            fs.copyFileSync('public/404.html', path.join('dist', '404.html'));
            console.log('Copied 404.html to dist folder');
          } else {
            console.error('404.html not found in public folder!');
          }
        } catch (error) {
          console.error('Error copying files:', error);
        }
        
        // Also copy important FFmpeg files to ensure they're available
        try {
          // Create ffmpeg directory in dist if it doesn't exist
          const ffmpegDistDir = path.join('dist', 'ffmpeg');
          if (!fs.existsSync(ffmpegDistDir)) {
            fs.mkdirSync(ffmpegDistDir, { recursive: true });
          }
          
          // Copy FFmpeg files
          fs.copyFileSync(
            path.join('public', 'ffmpeg', 'ffmpeg-core.js'),
            path.join(ffmpegDistDir, 'ffmpeg-core.js')
          );
          fs.copyFileSync(
            path.join('public', 'ffmpeg', 'ffmpeg-core.wasm'),
            path.join(ffmpegDistDir, 'ffmpeg-core.wasm')
          );
          fs.copyFileSync(
            path.join('public', 'ffmpeg', 'ffmpeg-core.worker.js'),
            path.join(ffmpegDistDir, 'ffmpeg-core.worker.js')
          );
          
          console.log('Copied FFmpeg files to dist/ffmpeg folder');
        } catch (error) {
          console.error('Error copying FFmpeg files:', error);
        }
      }
    }
  ],
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Isolation': 'require-corp'
    },
    fs: {
      strict: false,
      allow: ['..']
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
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
        }
      }
    }
  },
  assetsInclude: ['**/*.wasm', '**/*.worker.js'],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

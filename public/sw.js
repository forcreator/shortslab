// Service worker to apply COOP and COEP headers for SharedArrayBuffer support

// This service worker ensures CORS headers are set correctly
// for FFmpeg WebAssembly to work properly
console.log('Service worker loading...');

// Store the scope of our service worker (needed for GitHub Pages)
let scope = self.registration.scope;

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  // Skip waiting forces the service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  // Claim clients forces the service worker to become the active service worker on all clients
  event.waitUntil(self.clients.claim());
});

// Special handling for wasm files
const WASM_CONTENT_TYPE = 'application/wasm';

// Get the base path for GitHub Pages or custom domain
function getBasePath() {
  // For custom domain, no base path is needed
  if (self.location.hostname === 'shorts.forcreator.space') {
    return '';
  }
  
  // For GitHub Pages, extract repo name from path
  const pathParts = self.location.pathname.split('/');
  if (pathParts.length > 1 && self.location.hostname.includes('github.io')) {
    return '/' + pathParts[1];
  }
  
  return '';
}

const basePath = getBasePath();
console.log('Service worker using base path:', basePath);

// List of critical assets that need special handling
const CRITICAL_ASSETS = [
  '/ffmpeg/ffmpeg-core.wasm',
  '/ffmpeg/ffmpeg-core.js',
  '/ffmpeg/ffmpeg-core.worker.js'
];

// Intercept all fetch requests and add security headers
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle requests
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const newResponse = response.clone();
        const path = url.pathname;
        
        // Create a header map
        const headers = new Headers(newResponse.headers);
        
        // Add security headers to all responses
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
        headers.set('Cross-Origin-Isolation', 'require-corp');
        
        // Special handling for wasm files
        if (path.endsWith('.wasm')) {
          headers.set('Content-Type', WASM_CONTENT_TYPE);
          console.log('Service worker: Set wasm Content-Type for', path);
        }
        
        // Special handling for JS files
        if (path.endsWith('.js')) {
          headers.set('Content-Type', 'application/javascript');
          console.log('Service worker: Set JS Content-Type for', path);
        }
        
        // Create a new response with our headers
        return new Response(newResponse.body, {
          status: newResponse.status,
          statusText: newResponse.statusText,
          headers: headers
        });
      })
      .catch(error => {
        console.error('Service worker fetch error:', error, 'for URL:', event.request.url);
        return fetch(event.request);
      })
  );
});

// Helper function to add security headers to a response
function addSecurityHeaders(headers) {
  const newHeaders = new Headers(headers);
  
  // Add the security headers
  newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
  newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
  newHeaders.set('Cross-Origin-Isolation', 'require-corp');
  
  return newHeaders;
} 
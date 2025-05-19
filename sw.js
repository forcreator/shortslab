// Service worker to apply COOP and COEP headers for SharedArrayBuffer support

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

// Intercept all fetch requests and add security headers
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  
  // Clone the request
  const request = event.request.clone();
  
  // Create a new response with the same body but with headers added
  event.respondWith(
    fetch(request)
      .then(response => {
        // Clone the response
        const newResponse = response.clone();
        
        // Create a new response with the headers we need
        return new Response(newResponse.body, {
          status: newResponse.status,
          statusText: newResponse.statusText,
          headers: addSecurityHeaders(newResponse.headers)
        });
      })
      .catch(error => {
        console.error('Fetch error:', error);
        // Fall back to the original request if our version fails
        return fetch(request);
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
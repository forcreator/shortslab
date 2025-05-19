/**
 * Utility for checking browser capabilities required by the application
 */

export interface BrowserCapabilities {
  hasSharedArrayBuffer: boolean;
  isSecureContext: boolean;
  hasServiceWorker: boolean;
  hasProperHeaders: boolean;
  canRunFFmpeg: boolean;
}

/**
 * Check if the browser supports all required features for FFmpeg
 */
export const checkBrowserCapabilities = async (): Promise<BrowserCapabilities> => {
  // Check for SharedArrayBuffer
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  
  // Check for secure context
  const isSecureContext = window.isSecureContext;
  
  // Check for Service Worker API
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  // Check for proper headers (COEP and COOP)
  let hasProperHeaders = false;
  try {
    const response = await fetch(window.location.href);
    const coep = response.headers.get('Cross-Origin-Embedder-Policy');
    const coop = response.headers.get('Cross-Origin-Opener-Policy');
    hasProperHeaders = coep === 'require-corp' && coop === 'same-origin';
  } catch (error) {
    console.error('Error checking security headers:', error);
  }
  
  // Overall capability to run FFmpeg
  const canRunFFmpeg = hasSharedArrayBuffer && isSecureContext && hasProperHeaders;
  
  return {
    hasSharedArrayBuffer,
    isSecureContext,
    hasServiceWorker,
    hasProperHeaders,
    canRunFFmpeg
  };
};

/**
 * Show a warning modal if the browser doesn't meet requirements
 */
export const showBrowserWarningIfNeeded = async (): Promise<void> => {
  const capabilities = await checkBrowserCapabilities();
  
  if (!capabilities.canRunFFmpeg) {
    // Create modal elements
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';
    
    const content = document.createElement('div');
    content.style.backgroundColor = '#fff';
    content.style.borderRadius = '8px';
    content.style.padding = '24px';
    content.style.maxWidth = '500px';
    content.style.width = '90%';
    
    content.innerHTML = `
      <h2 style="margin-top: 0; color: #e53e3e; font-size: 20px;">Browser Compatibility Warning</h2>
      <p>This application requires modern browser features:</p>
      <ul>
        ${!capabilities.hasSharedArrayBuffer ? '<li>❌ <strong>SharedArrayBuffer</strong>: Not available in your browser</li>' : ''}
        ${!capabilities.isSecureContext ? '<li>❌ <strong>Secure Context</strong>: Not running in a secure context (HTTPS required)</li>' : ''}
        ${!capabilities.hasProperHeaders ? '<li>❌ <strong>Security Headers</strong>: Missing required COOP/COEP headers</li>' : ''}
      </ul>
      <p>For the best experience, please:</p>
      <ol>
        <li>Use latest Chrome, Edge, or Firefox</li>
        <li>Ensure you're accessing via HTTPS</li>
        <li>Refresh the page to allow our service worker to set proper headers</li>
      </ol>
      <button id="dismiss-warning" style="background-color: #4F46E5; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 16px;">
        I Understand, Continue Anyway
      </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Add event listener to dismiss button
    document.getElementById('dismiss-warning')?.addEventListener('click', () => {
      modal.remove();
    });
  }
};

/**
 * Report browser capabilities to console for debugging
 */
export const logBrowserCapabilities = async (): Promise<void> => {
  const capabilities = await checkBrowserCapabilities();
  
  console.group('Browser Capabilities Check');
  console.log('SharedArrayBuffer available:', capabilities.hasSharedArrayBuffer);
  console.log('Running in secure context:', capabilities.isSecureContext);
  console.log('Service Worker API available:', capabilities.hasServiceWorker);
  console.log('Proper security headers set:', capabilities.hasProperHeaders);
  console.log('Can run FFmpeg:', capabilities.canRunFFmpeg);
  console.groupEnd();
  
  return;
}; 
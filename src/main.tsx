import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logBrowserCapabilities, showBrowserWarningIfNeeded } from './utils/browser-check';

// Check browser capabilities and show warning if needed
// This is important for FFmpeg which requires SharedArrayBuffer support
// which in turn requires specific security headers and a secure context
(async () => {
  // Log capabilities to console for debugging
  await logBrowserCapabilities();
  
  // Wait for DOM to be fully loaded before showing any warnings
  // This ensures the app UI is ready before potentially showing a modal
  if (document.readyState === 'complete') {
    showBrowserWarningIfNeeded();
  } else {
    window.addEventListener('load', () => {
      showBrowserWarningIfNeeded();
    });
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

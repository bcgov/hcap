import createCache from '@emotion/cache';

// Create Emotion cache with nonce for CSP
export function createEmotionCache() {
  // Get the nonce from the window object that was set by the server
  const nonce = window.__CSP_NONCE__;

  return createCache({
    key: 'css',
    nonce: nonce,
    // Ensure styles are inserted at the top of <head>
    prepend: true,
  });
}

export default createEmotionCache;

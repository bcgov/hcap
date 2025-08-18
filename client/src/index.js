import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import 'react-app-polyfill/ie11';
import './assets/fonts/fonts.css';

import { Theme } from './constants';
import Routes from './routes';
import { Toast } from './components/generic';
import { ToastProvider, AuthContext } from './providers';

// Create emotion cache with CSP nonce support
const createEmotionCache = () => {
  let nonce;
  if (typeof window !== 'undefined') {
    // Get the nonce
    nonce =
      window.__CSP_NONCE__ ||
      document.querySelector('meta[property="csp-nonce"]')?.getAttribute('content') ||
      document.querySelector('script[nonce]')?.getAttribute('nonce');
    console.log('CSP Nonce for Emotion:', nonce); // Debug log

    // Set webpack nonce if available and not already set
    if (
      nonce &&
      typeof window.__webpack_require__ !== 'undefined' &&
      !window.__webpack_require__.nc
    ) {
      window.__webpack_require__.nc = nonce;
    }
  }

  return createCache({
    key: 'css',
    nonce,
  });
};

const cache = createEmotionCache();

const App = () => (
  <CacheProvider value={cache}>
    <ThemeProvider theme={Theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en'>
        <CssBaseline />
        <ToastProvider>
          <AuthContext.AuthProvider>
            <Toast />
            <Routes />
          </AuthContext.AuthProvider>
        </ToastProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </CacheProvider>
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

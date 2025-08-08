import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import 'react-app-polyfill/ie11';
import './assets/fonts/fonts.css';

import { Theme } from './constants';
import Routes from './routes';
import { Toast } from './components/generic';
import { ToastProvider, AuthContext } from './providers';

const App = () => (
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
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

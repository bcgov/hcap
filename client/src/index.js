import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

import 'react-app-polyfill/ie11';

import './index.css';

import { Theme } from './constants';
import Routes from './routes';
import { Toast } from './components/generic';
import { ToastProvider, AuthContext } from './providers';

const App = () => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={Theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <ToastProvider>
          <AuthContext.AuthProvider>
            <Toast />
            <div className='bg-red-100'>sssssssss</div>
            <Routes />
          </AuthContext.AuthProvider>
        </ToastProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </StyledEngineProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));

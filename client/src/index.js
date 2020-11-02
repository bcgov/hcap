import React from 'react';
import ReactDOM from 'react-dom';
import MomentUtils from '@date-io/moment';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import 'react-app-polyfill/ie11';

import { Theme } from './constants';
import Routes from './routes';
import { Toast } from './components/generic';
import { ToastProvider } from './providers';

const App = () => (
  <ThemeProvider theme={Theme}>
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <CssBaseline />
      <ToastProvider>
        <Toast />
        <Routes />
      </ToastProvider>
    </MuiPickersUtilsProvider>
  </ThemeProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));

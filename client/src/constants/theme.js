import { createMuiTheme } from '@material-ui/core/styles';

import LatoRegularFont from '../assets/fonts/Lato-Regular.ttf';
import LatoMediumFont from '../assets/fonts/Lato-Medium.ttf';
import LatoBoldFont from '../assets/fonts/Lato-Bold.ttf';

const latoRegular = {
  fontFamily: 'Lato',
  fontWeight: 400,
  src: `url(${LatoRegularFont}) format('truetype')`,
};

const latoMedium = {
  fontFamily: 'Lato',
  fontWeight: 500,
  src: `url(${LatoMediumFont}) format('truetype')`,
};

const latoBold = {
  fontFamily: 'Lato',
  fontWeight: 600,
  src: `url(${LatoBoldFont}) format('truetype')`,
};

export default createMuiTheme({
  // Colors
  palette: {
    default: {
      white: '#FFFFFF',
      black: '#000000',
    },
    primary: {
      lighter: '#1A5A96',
      light: '#003366',
      main: '#002C71',
    },
    secondary: {
      light: '#E2A014',
      main: '#FDB913',
    },
    highlight: {
      primary: '#40A9FF',
      secondary: '#1890FF',
    },
    warning: {
      main: '#6C4A00',
      light: '#F9F1C6',
      border: '#FAEBCC',
    },
    background: {
      default: '#FFFFFF',
      light: '#F2F2F2',
    },
    text: {
      primary: '#000000',
      secondary: '#333333',
    },
    headerText: {
      primary: '#FFFFFF',
      secondary: '#606060',
    },
    gray: {
      primary: '#F0F0F0',
      secondary: '#E8E8E8',
      dark: '#606060',
    },
  },

  // Typography
  typography: {
    fontFamily: 'Lato, sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '48px',
      lineHeight: '36px',
      letterSpacing: '-0.28px',
      color: '#000000',
    },
    h2: {
      fontWeight: 500,
      fontSize: '34px',
      lineHeight: '36px',
      letterSpacing: '-0.2px',
      color: '#000000',
      '@media (max-width:600px)': {
        fontSize: '21px',
        lineHeight: '22px',
        letterSpacing: 'normal',
      },
    },
    h3: {
      fontWeight: 600,
      fontSize: '27px',
      lineHeight: '34px',
      letterSpacing: 'normal',
      color: '#000000',
    },
    h4: {
      fontWeight: 600,
      fontSize: '20px',
      lineHeight: '24px',
      letterSpacing: 'normal',
      color: '#000000',
    },
    h5: {
      fontWeight: 400,
      fontSize: '18px',
      lineHeight: '22px',
      letterSpacing: 'normal',
      color: '#000000',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '20px',
      lineHeight: '24px',
      letterSpacing: 'normal',
      color: '#000000',
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: '17px',
      lineHeight: '22px',
      letterSpacing: 'normal',
      color: '#000000',
    },
    body1: {
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '18px',
      letterSpacing: '-0.25px',
      color: '#333333',
    },
    body2: {
      fontWeight: 400,
      fontSize: '12px',
      lineHeight: '18px',
      letterSpacing: 'normal',
      color: '#333333',
    },
    button: {
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: '21px',
      letterSpacing: 'normal',
      color: '#FFFFFF',
      textTransform: 'capitalize',
    },
    overline: {
      fontWeight: 400,
      fontSize: '12px',
      lineHeight: '18px',
      letterSpacing: 'normal',
      color: '#333333',
    },
  },

  // Component Overrides
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '@font-face': [latoRegular, latoMedium, latoBold],
      },
    },
    MuiIconButton: {
      root: {
        padding: '8px',
      },
    },
    MuiDrawer: {
      paper: {
        width: '80vw',
      },
    },
    MuiFilledInput: {
      root: {
        borderTopLeftRadius: '3px',
        borderTopRightRadius: '3px',
      },
      input: {
        paddingTop: '11px',
        paddingBottom: '11px',
      },
    },
    MuiOutlinedInput: {
      root: {
        backgroundColor: '#FFFFFF',
        '&:hover > .MuiOutlinedInput-notchedOutline': {
          borderColor: '#002C71',
        },
        '&.Mui-focused > .MuiOutlinedInput-notchedOutline': {
          borderWidth: '1px',
        },
      },
      input: {
        paddingTop: '11px',
        paddingBottom: '11px',
      },
    },
    MuiExpansionPanelDetails: {
      root: {
        display: 'block',
      },
    },
    MuiLink: {
      underlineHover: {
        textDecoration: 'underline',
      },
    },
  },
});

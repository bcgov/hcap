import { makeStyles } from '@material-ui/core/styles';
import backgroundImage from '../assets/images/employer_login_bg.png';
export const loginPageStyle = ({ withRightContainerBackground, addInfoStyle } = {}) =>
  makeStyles((theme) => ({
    blueText: {
      color: theme.palette.primary.light,
    },
    blueBox: {
      backgroundColor: '#EDF6FF',
      maxWidth: 554,
    },
    pageContainer: {
      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
      },
      [theme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },
    rightContainer: {
      padding: '10%',
      [theme.breakpoints.up('md')]: {
        width: '50%',
      },
      backgroundColor: theme.palette.background.default,
      ...(withRightContainerBackground && {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
      }),
    },
    leftContainer: {
      padding: '10%',
      [theme.breakpoints.up('md')]: {
        width: '50%',
      },
    },
    ...(addInfoStyle && {
      info: {
        marginRight: '8px',
        marginTop: '5px',
      },
    }),
  }));

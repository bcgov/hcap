import { makeStyles } from '@material-ui/core/styles';
import backgroundImage from '../assets/images/employer_login_bg.png';

const loginPageBaseStyleConfig = (theme, { withRightContainerBackground } = {}) => ({
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
});

export const participantLoginPageStyle = (option = {}) =>
  makeStyles((theme) => loginPageBaseStyleConfig(theme, option));

export const employerLoginPageStyle = (option = {}) =>
  makeStyles((theme) => ({
    ...loginPageBaseStyleConfig(theme, option),
    info: {
      color: theme.palette.primary.light,
    },
    bottomBox: {
      marginTop: '55%',
      width: '68%',
      backgroundColor: theme.palette.background.default,
      flexDirection: 'row',
    },
  }));

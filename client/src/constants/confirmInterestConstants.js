import InfoIcon from '@material-ui/icons/Info';
import ContactMailIcon from '@material-ui/icons/ContactMail';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

export const confirmInterestDefault = {
  title: 'Confirm Interest',
  description: `Please click on the “Confirm Interest” button to confirm that you are still interested in participating in the Health Career Access Program.`,
  icon: ContactMailIcon,
  hasButton: true,
  buttonText: 'Confirm Interest',
  iconClass: 'icon',
};
export const confirmInterestSuccess = {
  title: 'Thanks For Letting Us Know',
  icon: CheckBoxIcon,
  description: `You have successfully confirmed your continued interest in participating in the Health Career Access Program (HCAP). Your information has been updated accordingly.`,
  hasButton: false,
  buttonText: '',
  iconClass: 'check',
};
export const confirmInterestError = {
  title: 'Invalid Link',
  icon: InfoIcon,
  description: `This link is invalid or your interest has already been confirmed.`,
  hasButton: false,
  buttonText: '',
  iconClass: 'error',
};

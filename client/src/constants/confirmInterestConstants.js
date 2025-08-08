import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

export const confirmInterestDefault = {
  title: 'Confirm Interest',
  description: `Please click on the “Confirm Interest” button to confirm that you are still interested in participating in the Health Career Access Program.`,
  icon: ContactMailIcon,
  buttonText: 'Confirm Interest',
  iconClass: 'icon',
};
export const confirmInterestSuccess = {
  title: 'Thanks For Letting Us Know',
  icon: CheckBoxIcon,
  description: `You have successfully confirmed your continued interest in participating in the Health Career Access Program (HCAP). Your information has been updated accordingly.`,
  buttonText: null,
  iconClass: 'check',
};
export const confirmInterestError = {
  title: 'Invalid Link',
  icon: InfoIcon,
  description: `This link is invalid or your interest has already been confirmed.`,
  buttonText: null,
  iconClass: 'error',
};
export const confirmInterestLoading = {
  title: 'Loading',
  icon: HourglassEmptyIcon,
  description: ``,
  buttonText: null,
  iconClass: 'icon',
};

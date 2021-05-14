import InfoIcon from '@material-ui/icons/Info';
import ContactMailIcon from '@material-ui/icons/ContactMail';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

export const confirmInterestDefault = {
  title: 'Confirm Interest',
  description: `Please click on the "Confirm Interest" to confirm that you are still interested in participating in the Health Career Access Program`,
  icon: ContactMailIcon,
  buttonText: 'Confirm Interest',
  iconClass: 'icon',
};
export const confirmInterestSuccess = {
  title: 'Thanks For Letting Us Know',
  icon: CheckBoxIcon,
  description: `You have successfully confirmed your interest. `,
  buttonText: 'Ok',
  iconClass: 'check',
};
export const confirmInterestError = {
  title: 'Expired Link',
  icon: InfoIcon,
  description: `This link has expired as your interest has already been confirmed.`,
  buttonText: 'Close',
  iconClass: 'error',
};

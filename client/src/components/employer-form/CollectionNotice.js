import React from 'react';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { Field } from 'formik';
import { RenderCheckbox } from '../fields';
import { useLocation } from 'react-router-dom'
import { Routes } from '../../constants';


const CollectionNotice = ({ isDisabled }) => {
  const location = useLocation();

  return (
    <Grid item xs={12}>
      <Grid container spacing={2}>

        {/** Certification */}
        <Grid item xs={12}>
          <Field
            name="doesCertify"
            component={RenderCheckbox}
            label="I certify this information to be accurate"
            disabled={isDisabled || location.pathname === Routes.EmployerConfirmation}
          />
        </Grid>

        {/** Collection Notice & Contact */}
        <Grid item xs={12}>
          <Typography variant="body1" gutterBottom>
            <b>Collection Notice</b>
          </Typography>
          <Typography variant="body2" paragraph>
            Personal information is collected via this form under&nbsp;
            <Link href="https://www.bclaws.ca/civix/document/id/complete/statreg/96165_03#section26">
                sections 26(c) and (e) of the Freedom of Information and Protection of Privacy Act
            </Link>
            &nbsp;(FOIPPA) for the purposes of administering the Health Career Access Program.
          </Typography>
          <Typography variant="body2" paragraph>
            Personal information will only be used by authorized personnel to fulfill the purpose for
            which it was originally collected or for a use consistent with that purpose unless you
            expressly consent otherwise. We do not disclose your information to other public bodies or
            individuals except as authorized by FOIPPA.
          </Typography>
          <Typography variant="body2" paragraph>
            If you have any questions about our collection or use of personal information, please
            direct your inquiries to:
          </Typography>
          <Typography variant="body2" paragraph>
            Title: Director, Planning, Integration and Partnerships
            <br />
            Address: 1515 Blanshard Street Victoria BC V8W 3C8
            <br />
            Telephone:&nbsp;
            <Link href="tel:+2364783520">
              236-478-3520
            </Link>
            <br />
            Email:&nbsp;
            <Link href="mailto:HCAPInfoQuery@gov.bc.ca">
              HCAPInfoQuery@gov.bc.ca
            </Link>
          </Typography>

        </Grid>
      </Grid>
    </Grid>
  );
};

export { CollectionNotice };

import React from 'react';
// import Grid from '@material-ui/core/Grid';
// import Card from '@material-ui/core/Card';
// import CardActions from '@material-ui/core/CardActions';
// import CardContent from '@material-ui/core/CardContent';
import {Button} from '../../components/generic/Button'
// import { makeStyles } from '@material-ui/core/styles';
// import store from 'store';
import Typography from '@material-ui/core/Typography';
import { Page } from '../../components/generic';
import { API_URL } from '../../constants';
import store from 'store';

import * as qs from 'querystring';


// const useStyles = makeStyles({
//   root: {
//     minWidth: 275,
//   },
//   bullet: {
//     display: 'inline-block',
//     margin: '0 2px',
//     transform: 'scale(0.8)',
//   },
//   title: {
//     fontSize: 14,
//   },
//   pos: {
//     marginBottom: 12,
//   },
// });

// const getParticipants = async () => {
//   try {

//     return response.json();
//   } catch {
//     return [];
//   }
// };

export default (props) => {
//   const [interests, setInterests] = useState([]);
//   const classes = useStyles();

  const query = qs.parse(props.location.search.slice(1), '&', '=');
  return (
    <Page>
        <Typography variant={'h1'}>PEOI LANDING</Typography>
        <Button 
          fullWidth={false}
          text={'Reconfirm Interest'}
          onClick={async ()=>{
            console.log(query);
            const res = await fetch(`${API_URL}/api/v1/user/peoi?id=${query.id}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${store.get('TOKEN')}`,
                Accept: 'application/json',
                'Content-type': 'application/json',
              },
            });
            console.log(res)
          }}
        />

    </Page>
  );
};

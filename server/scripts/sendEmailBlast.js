const { dbClient } = require('../db/db')
const axios = require('axios');
const CHES_HOST = 'https://ches-dev.apps.silver.devops.gov.bc.ca';
const AUTH_URL = 'https://dev.oidc.gov.bc.ca/auth/realms/jbd6rnxw/protocol/openid-connect/token';
require('dotenv').config({ path: '../.env' });

async function authenticateChes() {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
  
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: { username: '', password: '' }, // service client ID and secret
    };
   try {
      const response = await axios.post(AUTH_URL, params, config);
      return response.data.access_token;
    } catch (error) {
      console.log({ '@@@@': error });
      return error;
    }
  }
//   const sleep = (ms) => {
//     return new Promise((resolve) => setTimeout(resolve, ms));
//   };

// Get creds -- Done
// Authenticate -- lets see. 
// Send email to me
// 

function createPayload(recipient){
    return {
        from:'noreply@hcapparticipants.gov.bc.ca',
        to:recipient,
        subject: 'CHES Test Email',
        bodyType: 'html',
        body: `<html><h1>HELLO WORLD </h1></html>`,
    }
}

const config = (token) => ({
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

async function getEmailBlock(index,block){
    return await dbClient.db.query(`SELECT email_address FROM confirm_interest LIMIT ${block} OFFSET ${index}`)
}
async function countEmails(){
    await dbClient.connect();
    return await dbClient.db.query('SELECT Count(*) FROM confirm_interest')
}

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

async function sendEmail(email,conf){
    const  payload = createPayload(email)
    console.log('Sending to Email:', email);
    //console.log(payload);
    // try{
    //     await axios.post(`${CHES_HOST}/api/v1/email`,createPayload(email),conf);
    // }catch(e){
    //     //console.log(e);
    //     console.log(e.response.data.errors);
    // }
    return; 
}

async function blast(start,end,batch){
    const count = (await countEmails())[0].count;
    console.log(count);
    await blastRecursive(start, end, count,batch)
}

async function blastRecursive(start,end,max,batch){
    console.log(start,max,batch);
    if(start>=max || (start >= end && end!=-1)){
        return
    }else{
        const emails = await getEmailBlock(start,batch)
        const promiseArr = emails.map((res)=>{
              return sendEmail(res.email_address)
        })
        console.log(promiseArr)
        await Promise.all(promiseArr)
        await sleep(1000)
        return await blastRecursive(start+batch,end,max,batch);
    }
}
async function count(){
    await dbClient.connect();
    return await dbClient.db.query('Select COUNT(*) from confirm_interest')
}


(async function emailBlast() {
    //const token = await authenticateChes();
    await blast(0,-1,3);


    // switch(process.env.argv[2]){
    //     case 'all':
    //         break; 
    //     case 'index': 
    //         const start = process.env.argv[3];
    //         const end = process.env.argv[4];
    //         const batch = process.env.argv[5];
            
    //         break; 
    //     case 'count':
    //         const res = await count();
    //         console.log(res[0].count);
    //         break;
    //     default:

    // }
})()
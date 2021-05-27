/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const path = require('path');
const { writeFileSync } = require('fs');
const { dbClient } = require('../db/db');

const Reset = '\x1b[0m';
const FgGreen = '\x1b[32m';

const MAIL_RATE = 20;
const CHES_HOST = process.env.CHES_HOST || 'https://ches-dev.apps.silver.devops.gov.bc.ca';
const CHES_AUTH_URL =
  process.env.CHES_AUTH_URL ||
  'https://dev.oidc.gov.bc.ca/auth/realms/jbd6rnxw/protocol/openid-connect/token';
const failedSends = [];

const withdrawEmailSubject = encodeURI(`
  WITHDRAW
`);
const withdrawEmailBody = encodeURI(`
  Hello, please withdraw the expression(s) of interest for the sender of this email.
  I am no longer interested in participating in the Health Career Access Program.
`);

async function authenticateChes() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    auth: { username: process.env.CHES_CLIENT_ID, password: process.env.CHES_CLIENT_SECRET }, // service client ID and secret
  };
  try {
    const response = await axios.post(CHES_AUTH_URL, params, config);
    return response.data.access_token;
  } catch (error) {
    console.error(error);
    return error;
  }
}
function createPayload(recipient, uuid) {
  return {
    from: 'noreply@hcapparticipants.gov.bc.ca',
    to: [recipient],
    subject: 'Health Career Access Program (HCAP) Participation',
    bodyType: 'html',
    body: `
      <body>
        <h2>Are you still interested in the Health Career Access Program?</h2>
        <br />
        <p>If you would still like to participate in the program,
          <br />
          please confirm your interest by clicking on the link below. Clicking on the link will reconfirm your interest in the program to ensure you remain visible to eligible employers.
        </p>
        <a href="${`${process.env.CLIENT_URL}/confirm-interest?id=${uuid}`}" rel="noopener" target="_blank">
          Confirm Interest
        </a> <span>(${process.env.CLIENT_URL}/confirm-interest?id=${uuid})</span>
        <br />
        <p>If you no longer wish to participate or be considered for the Health Career Access Program, please email us with the subject line WITHDRAW to <b>HCAPInfoQuery@gov.bc.ca</b> or or click the link below.</p>
        <a href="mailto:HCAPInfoQuery@gov.bc.ca?subject=${withdrawEmailSubject}&body=${withdrawEmailBody}">
          Withdraw from HCAP
        </a> 
      </body>
    `,
  };
}

const config = {
  headers: {
    authorization: null,
    'Content-Type': 'application/json',
  },
};

async function getEmailBlock(index, block) {
  return dbClient.db.query(
    `SELECT email_address , otp FROM confirm_interest LIMIT ${block} OFFSET ${index}`
  );
}
async function countEmails() {
  await dbClient.connect();
  return dbClient.db.query('SELECT Count(*) FROM confirm_interest');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendEmail(email, otp, conf) {
  try {
    await axios.post(`${CHES_HOST}/api/v1/email`, createPayload(email, otp), conf);
  } catch (e) {
    failedSends.push(otp);
    console.log(e.response?.data || e.response || e);
  }
}

async function updateToken() {
  config.headers.authorization = `Bearer ${await authenticateChes()}`;
}

async function blastRecursive(start, end, max, batch, chesConfiguration) {
  const now = new Date();
  if (start >= max || (start >= end && end !== -1)) {
    return true;
  }
  const emails = await getEmailBlock(start, batch);
  // test the token
  try {
    await axios.get(`${CHES_HOST}/api/v1/health`, chesConfiguration);
  } catch (e) {
    if (e?.response?.data === 'Access denied') {
      console.log('Token Expired, Reauthorizing...');
      await updateToken();
      console.log(`Success, Token Reauthorized!`);
    } else {
      console.log(e.response?.data || e.response || e);
    }
  }

  const promiseArr = emails.map((res) => sendEmail(res.email_address, res.otp, chesConfiguration));
  Promise.all(promiseArr);
  await sleep((batch / MAIL_RATE) * 1000);
  const batchTime = (new Date() - now) / 1000;
  console.log(
    `Sent ${FgGreen}${start}${Reset} to ${FgGreen}${
      start + batch
    }${Reset}: ${FgGreen}${batchTime.toFixed(2)}${Reset}s, ${FgGreen}${(batch / batchTime).toFixed(
      1
    )}${Reset}/s`
  );
  return blastRecursive(start + batch, end, max, batch, chesConfiguration);
}

async function blast(start, end, batch) {
  const { count } = (await countEmails())[0];
  console.log(`Blasting ${FgGreen}${count}${Reset} emails...`);
  await updateToken();

  const now = new Date();
  await blastRecursive(start, end, count, batch, config);
  const totalTime = (new Date() - now) / 1000;
  console.log(
    `Sent ${FgGreen}${count}${Reset} emails in ${totalTime.toFixed(2)}s at a rate of ${(
      count / totalTime
    ).toFixed(2)}`
  );
}

const writeFailedSends = (failures) => {
  console.log(`There were ${failures.length} failed sends.`);
  if (failures.length === 0) return;
  const timestamp = new Date().toJSON();
  const failureJson = JSON.stringify(failures);
  console.log(failures);
  writeFileSync(path.join(__dirname, `failed_ches_sends-${timestamp}.json`), failureJson);
};

(async function emailBlast() {
  const arglength = process.argv.length;
  const mode = arglength > 2 ? process.argv[2] : 'default';
  const start = arglength > 3 ? parseInt(process.argv[3], 10) : 0;
  const end = arglength > 4 ? parseInt(process.argv[4], 10) : -1;
  const batch = arglength > 5 ? parseInt(process.argv[5], 10) : 100;
  switch (mode) {
    case 'all':
      await blast(0, -1, 100);
      writeFailedSends(failedSends);
      break;
    case 'index':
      console.log(start, end, batch);
      await blast(start, end, batch);
      writeFailedSends(failedSends);
      break;
    case 'count':
      console.log((await countEmails())[0].count);
      break;
    default:
      console.log('No action specified');
  }
  console.log('Process complete');
  process.exit(0);
})();

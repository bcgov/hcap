/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const { dbClient } = require('../db/db');
const logger = require('../logger.js');

const UNKNOWN_RETRY_DELAY = 1000;
const RETRY_LIMIT = 10;
const MAIL_RATE = 10;
const CHES_HOST = process.env.CHES_HOST || 'https://ches-dev.apps.silver.devops.gov.bc.ca';
const CHES_AUTH_URL =
  process.env.CHES_AUTH_URL ||
  'https://dev.oidc.gov.bc.ca/auth/realms/jbd6rnxw/protocol/openid-connect/token';

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

async function getAllEmails() {
  return dbClient.db.query(`SELECT email_address, otp FROM confirm_interest`);
}

const config = {
  headers: {
    authorization: null,
    'Content-Type': 'application/json',
  },
};

async function updateToken() {
  config.headers.authorization = `Bearer ${await authenticateChes()}`;
  console.log(`Token retrieved successfully!`);
}

async function sendEmail(email, otp) {
  if (email.includes('1564d6737f53')) throw new Error('test');
  // if (email.includes('+4')) throw new Error('test');
  const delayFromRate = 1000 / MAIL_RATE;
  await Promise.all([
    axios.post(`${CHES_HOST}/api/v1/email`, createPayload(email, otp), config),
    new Promise((resolve) => setTimeout(resolve, delayFromRate)),
  ]);
}

function printProgress(progress) {
  process.stdout.cursorTo(0);
  process.stdout.write(progress);
  // console.log(progress);
}

const average = (arr) => arr.reduce((prev, curr) => prev + curr) / arr.length;

(async function emailBlast() {
  await dbClient.connect();
  await updateToken();

  const emails = await getAllEmails();
  const start = new Date();

  const previousTTS = [];
  let errors = 0;

  console.log(`${emails.length} emails loaded.\n`);
  for (let i = 0; i < emails.length; i += 1) {
    const email = emails[i];
    let sent = false;
    let counter = 0;
    while (!sent && counter < RETRY_LIMIT) {
      try {
        const earlier = new Date();
        await sendEmail(email.email_address, email.otp);
        const later = new Date();
        const timeToSend = later - earlier;
        previousTTS.push(timeToSend);
        if (previousTTS.length > 100) previousTTS.length = 100;
        const delayAverage = average(previousTTS).toFixed(0);
        const data = [
          `Delay: ${timeToSend}`,
          `Total Time: ${((later - start) / 1000).toFixed(0)}s`,
          `Delay Avg: ${delayAverage}`,
          `Rate Avg: ${delayAverage > 0 ? (1000 / delayAverage).toFixed(0) : 'NaN'}`,
          `${i + 1} of ${emails.length}`,
          `ID: ${email.otp}`,
        ];
        printProgress(data.join('    '));
        sent = true;
      } catch (error) {
        if (error?.response?.data === 'Access denied') {
          console.log('Token Expired, Reauthorizing...');
          await updateToken();
        } else {
          counter++;
          printProgress(
            `Unexpected error, waiting ${UNKNOWN_RETRY_DELAY}ms before resuming. Attempt ${counter}/${RETRY_LIMIT}`
          );
          await new Promise((resolve) => setTimeout(resolve, UNKNOWN_RETRY_DELAY));
        }
      }
    }
    if (!sent) {
      errors++;
      process.stdout.cursorTo(0);
      logger.error({
        action: 'email_send_failure',
        email,
        error: `Email not sent after ${RETRY_LIMIT} attempts`,
      });
      console.log();
    }
  }

  console.log('\n');

  if (errors) console.log(`${errors} errors logged.`);

  console.log('Process complete');
  process.exit(0);
})();

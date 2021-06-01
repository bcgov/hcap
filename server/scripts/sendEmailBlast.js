/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const readline = require('readline');
const { dbClient } = require('../db/db');
const logger = require('../logger.js');
const { collections } = require('../db/schema');

// https://stackoverflow.com/a/40560590
const colours = {
  reset: '\x1b[0m',
  fg: {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
  },
};

const CHES_HOST = process.env.CHES_HOST || 'https://ches-dev.apps.silver.devops.gov.bc.ca';
const CHES_AUTH_URL =
  process.env.CHES_AUTH_URL ||
  'https://dev.oidc.gov.bc.ca/auth/realms/jbd6rnxw/protocol/openid-connect/token';

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
  const withdrawEmailSubject = encodeURI(`
    WITHDRAW
  `);
  const withdrawEmailBody = encodeURI(`
    Hello, please withdraw the expression(s) of interest for the sender of this email.
    I am no longer interested in participating in the Health Career Access Program.
  `);

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

async function getEmails(limit) {
  await dbClient.connect();
  const data = await dbClient.db[collections.CONFIRM_INTEREST].find(
    {
      email_sent: false,
    },
    {
      limit,
    }
  );
  console.log(`${colours.fg.green}${data.length} emails loaded.${colours.reset}`);
  return data;
}

const config = {
  headers: {
    authorization: null,
    'Content-Type': 'application/json',
  },
};

async function updateToken() {
  config.headers.authorization = `Bearer ${await authenticateChes()}`;
  console.log(`${colours.fg.green}Token retrieved successfully.${colours.reset}`);
}

async function sendEmail(email, otp, delay) {
  await Promise.all([
    axios.post(`${CHES_HOST}/api/v1/email`, createPayload(email, otp), config),
    new Promise((resolve) => setTimeout(resolve, delay)),
  ]);
  await dbClient.db[collections.CONFIRM_INTEREST].save({
    otp,
    email_sent: true,
  });
}

function printProgress(progress) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(progress);
}

const average = (arr) => arr.reduce((prev, curr) => prev + curr) / arr.length;

const serialSend = async (emails, retryDelay, retryLimit, mailRate) => {
  const start = new Date();
  const sendDelay = 1000 / mailRate;

  const previousTTS = [];
  let errors = 0;

  for (let i = 0; i < emails.length; i += 1) {
    const email = emails[i];
    let sent = false;
    let retryCounter = 0;
    while (!sent && retryCounter < retryLimit) {
      try {
        // Send single email and time it
        const earlier = new Date();
        await sendEmail(email.email_address, email.otp, sendDelay);
        const later = new Date();
        const timeToSend = later - earlier;
        // Add time to send to previous times to send array,
        previousTTS.unshift(timeToSend);
        if (previousTTS.length > 100) previousTTS.length = 100;
        // calculate average of last 100 email sends
        const delayAverage = average(previousTTS).toFixed(2);
        // Cleaner way to build long template string
        const data = [
          `Delay: ${timeToSend}`,
          `Total Time: ${((later - start) / 1000).toFixed(0)}s`,
          `Delay Avg: ${delayAverage}`,
          `Rate Avg: ${delayAverage > 0 ? (1000 / delayAverage).toFixed(2) : 'NaN'}`,
          `${i + 1}/${emails.length}`,
          `ID: ${email.otp}`,
        ];
        printProgress(data.join('\t'));
        if (retryCounter > 0) {
          printProgress(
            `${colours.fg.green}Retry Success on ${colours.reset}${email.email_address}\n`
          );
        }
        // exit loop
        sent = true;
      } catch (error) {
        // catch token expiration
        if (error?.response?.data === 'Access denied') {
          console.log(`\n${colours.fg.yellow}Token Expired, Reauthorizing...${colours.reset}`);
          await updateToken();
        } else {
          // unknown error, delay and retry `retryLimit` times
          retryCounter++;
          printProgress(
            `${colours.fg.yellow}Unexpected error, waiting ${retryDelay}ms before resuming. Attempt ${retryCounter}/${retryLimit} on ${colours.reset}${email.email_address}\n`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
    // this is run after we've retried a single email `retryLimit` times
    if (!sent) {
      errors++;
      process.stdout.cursorTo(0);
      logger.error({
        action: 'email_send_failure',
        email,
        error: `Email not sent after ${retryLimit} attempts`,
      });
      console.log();
    }
  }
  console.log('\n');

  if (errors) {
    console.log(`${colours.fg.red}${errors} error${errors > 0 ? 's' : ''} logged.${colours.reset}`);
  } else {
    console.log(`${colours.fg.green}No errors encountered.${colours.reset}`);
  }
};

function askQuestion(query, defaultValue) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(`${query} [${defaultValue}]: `, (ans) => {
      rl.close();
      resolve(ans ? parseInt(ans, 10) : defaultValue);
    })
  );
}

(async function emailBlast() {
  const mailRate = await askQuestion('Max Rate', 15);
  const retryDelay = await askQuestion('Retry Delay (ms)', 10000);
  const retryLimit = await askQuestion('Retry Limit', 10);
  const mailLimit = await askQuestion('Total Mail Limit', 10000);

  /**
   * CHES Daily Limit = 10,000
   * https://github.com/bcgov/common-hosted-email-service/wiki/Best-Practices#rate-limits
   */
  if (mailLimit > 10000) {
    console.log(`${colours.fg.red}Defaulting to 10,000 emails.${colours.reset}`);
  }

  const emails = await getEmails(mailLimit);
  await updateToken();

  await serialSend(emails, retryDelay, retryLimit, mailRate);

  console.log('Process complete');
  process.exit(0);
})();

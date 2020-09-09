const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { randomBytes } = require('crypto');
const { validate, FormSchema } = require('./validation.js');
const { dbClient, collections } = require('./db');
const { errorHandler, asyncMiddleware } = require('./error-handler.js');

const apiBaseUrl = '/api/v1';
const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Create new form, not secured
app.post(`${apiBaseUrl}/form`,
  asyncMiddleware(async (req, res) => {
    await validate(FormSchema, req.body); // Validate submitted form against schema
    const formsCollection = dbClient.db.collection(collections.FORMS);

    // Generate unique random hex id
    async function generateRandomHexId() {
      const randomHexId = randomBytes(4).toString('hex').toUpperCase();

      // Query database do make sure id does not exist, avoiding collision
      if (await formsCollection.countDocuments({ id: randomHexId }, { limit: 1 }) > 0) {
        return generateRandomHexId();
      }
      return randomHexId;
    }

    // Form ID
    const id = await generateRandomHexId();

    const currentISODate = new Date().toISOString();
    const formItem = {
      id,
      ...req.body,
      createdAt: currentISODate,
      updatedAt: currentISODate,
    };

    await formsCollection.insertOne(formItem);

    return res.json({ id });
  }));

// Version number
app.get(`${apiBaseUrl}/version`,
  (req, res) => res.json({ version: process.env.VERSION }));

// Client app
if (process.env.NODE_ENV === 'production') {
  app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
}

app.use(errorHandler);

module.exports = app;

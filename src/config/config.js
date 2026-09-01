require('dotenv').config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'https://www.play-qa.com',
  // axios exposes a single deadline (connect + response) — there is no separate connect timeout.
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '20000', 10),
};

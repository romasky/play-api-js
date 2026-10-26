/** System endpoints — health, the downloadable API descriptions, reCAPTCHA verification. */
const { request } = require('../http/client');
const paths = require('../http/paths');
const { choose } = require('../utils/lookup');

module.exports = {
  health:          (headers = {}) => request('GET',  paths.HEALTH, { headers }),
  document:        (name, params) => request('GET',  choose(paths.API_DOCUMENTS, name, 'API document'), { params }),
  verifyRecaptcha: (body)         => request('POST', paths.VERIFY_RECAPTCHA, { json: body }),
};

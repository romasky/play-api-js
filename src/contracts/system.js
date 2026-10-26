/** System contracts — GET /health, the downloadable API descriptions, POST /verify-recaptcha. */
const { str, bool, object, arr, nullable, obj, entry } = require('./schema');

const HealthResponse = obj({ status: str, time: str });

const OpenApiDocument = obj({ swagger: str, basePath: str, info: object, paths: object });

const PostmanCollection = obj({ info: object, item: arr(), variable: arr(object) });

const PostmanEnvironment = obj({ name: str, values: arr(object) });

// 200 means Google answered — `success` says whether the token passed (a bogus one: false + error_codes)
const RecaptchaVerifyResponse = obj({ success: bool }, { error_codes: nullable(arr(str)) });

const CONTRACTS_2XX = [
  entry('GET',  '/health',                  'HealthResponse',          HealthResponse),
  entry('GET',  '/openapi\\.json',          'OpenApiDocument',         OpenApiDocument),
  entry('GET',  '/postman/collection\\.json',  'PostmanCollection',    PostmanCollection),
  entry('GET',  '/postman/environment\\.json', 'PostmanEnvironment',   PostmanEnvironment),
  entry('POST', '/verify-recaptcha',        'RecaptchaVerifyResponse', RecaptchaVerifyResponse),
];

module.exports = { CONTRACTS_2XX };

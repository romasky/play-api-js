/**
 * Response contracts — `request()` validates EVERY 2xx JSON response against the documented shape, so a
 * field disappearing from `POST /mail/create` fails the request step even in a scenario that only asserts
 * the status code.
 *
 * New 2xx endpoint → add its schema and a row to the domain module's `CONTRACTS_2XX` (and the module here).
 * Endpoints answering 2xx with an empty body (DELETE 204, HEAD, OPTIONS) or raw bytes (downloads) have no row.
 */
const Ajv = require('ajv');
const { show } = require('../http/attach');

const ajv = new Ajv({ strict: true, allowUnionTypes: true, allErrors: true });

const ENTRIES = [
  ...require('./system').CONTRACTS_2XX,
  ...require('./users').CONTRACTS_2XX,
  ...require('./auth').CONTRACTS_2XX,
  ...require('./admin').CONTRACTS_2XX,
  ...require('./mail').CONTRACTS_2XX,
  ...require('./files').CONTRACTS_2XX,
  ...require('./webhooks').CONTRACTS_2XX,
  ...require('./bugs').CONTRACTS_2XX,
  ...require('./challenges').CONTRACTS_2XX,
  ...require('./chaos').CONTRACTS_2XX,
].map((e) => ({ ...e, validate: ajv.compile(e.schema) }));

/** A 2xx body broke its contract. `response` is the real response, so callers can still clean up. */
class ContractError extends Error {
  constructor(message, response) {
    super(message);
    this.name = 'ContractError';
    this.response = response;
  }
}

/** The documented 2xx contract of `method path`, or undefined (empty-body or binary responses). */
function contractFor(method, path) {
  const pathname = path.split('?')[0];
  return ENTRIES.find((e) => e.method === method && e.re.test(pathname));
}

function violation(contract, body) {
  if (contract.validate(body)) return undefined;
  const errors = ajv.errorsText(contract.validate.errors, { dataVar: 'body' });
  return `${contract.name} contract violated: ${errors}. Body: ${show(body)}`;
}

/** Throws ContractError when `body` (the parsed 2xx JSON of `method path`) breaks its contract. */
function check(method, path, response, body) {
  const contract = contractFor(method, path);
  const message = contract && violation(contract, body);
  if (message) throw new ContractError(message, response);
}

/** Explicit step assertion: `body` satisfies the named contract (e.g. 'UserResponse'). */
function assertContract(name, body) {
  const contract = ENTRIES.find((e) => e.name === name);
  if (!contract) throw new Error(`unknown contract '${name}'`);
  const message = violation(contract, body);
  if (message) throw new Error(message);
}

module.exports = { check, contractFor, assertContract, ContractError };

/**
 * A tiny JSON Schema vocabulary for the response contracts.
 *
 * Contracts are strict on TYPES (an integer field rejects "900", a boolean rejects "true") but allow extra
 * properties: the API may add fields; a contract asserts the presence and type of the documented ones.
 *
 *   obj({ id: str }, { bio: str })   → `id` required, `bio` optional
 *   nullable(bool)                   → present, boolean or null (keys that are "always present, maybe null")
 */
const { BASE } = require('../http/paths');

const str  = { type: 'string' };
const int  = { type: 'integer' };
const num  = { type: 'number' };
const bool = { type: 'boolean' };
const any  = {};
const object = { type: 'object' };

const arr      = (items = any) => ({ type: 'array', items });
const nullable = (schema) => ({ ...schema, type: [schema.type, 'null'] });
const obj      = (required, optional = {}) => ({
  type: 'object',
  properties: { ...required, ...optional },
  required: Object.keys(required),
});

/** A registry row: one documented 2xx JSON shape of `method` + path (regex under BASE, anchored at the end). */
const entry = (method, pathRegex, name, schema) => ({ method, re: new RegExp(`${BASE}${pathRegex}$`), name, schema });

module.exports = { str, int, num, bool, any, object, arr, nullable, obj, entry };

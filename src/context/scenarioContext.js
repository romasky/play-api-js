/**
 * Transitional facade over the current scenario's World (support/world.js) for step files that still use
 * arrow functions. Removed once every step file uses `this` (function steps).
 */
const { show } = require('../http/attach');

let world = null;

const bind = (w) => { world = w; };

const save = (key, value) => world.save(key, value);
const get  = (key, failIfMissing = false) => world.get(key, failIfMissing);
const opt  = (key) => world.opt(key);
const str  = (key) => world.str(key);

function assertStatusCode(expected, varName) {
  const response = world.res(varName);
  if (response.status !== expected) {
    throw new Error(`Expected status ${expected} but got ${response.status}. Body: ${show(response.data)}`);
  }
}

module.exports = { bind, save, get, opt, str, assertStatusCode };

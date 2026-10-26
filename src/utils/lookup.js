/** The one way a step-supplied name selects an entry from a fixed table, with an error listing the valid names. */
function choose(table, name, what) {
  if (!Object.hasOwn(table, name)) {
    throw new Error(`unknown ${what} '${name}', expected one of ${Object.keys(table).sort().join(', ')}`);
  }
  return table[name];
}

module.exports = { choose };

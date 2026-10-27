/** The command-line options of the tools/ scripts — one parser, so `--max` without a value fails the same everywhere. */

/** The value after `name`, parsed with `parse`; `fallback` when the option is absent. */
function option(argv, name, fallback, parse = (value) => value) {
  const at = argv.indexOf(name);
  if (at === -1) return fallback;
  const value = argv[at + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`${name} needs a value`);
  const parsed = parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${name} must be a number, got '${value}'`);
  return parsed;
}

const flag = (argv, name) => argv.includes(name);

module.exports = { option, flag };

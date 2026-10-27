/**
 * Loaded with `--require` (through NODE_OPTIONS, so `node --test` children get it too) by tools/mutate.js: when
 * UB_MUTANT names a mutant, the one file it targets is compiled with the mutant spliced in. The file on disk is
 * never touched — a crash mid-run cannot leave a mutated tree behind.
 */
const Module = require('module');

/** The source with the mutant's [start, end) range replaced. */
const apply = (source, { start, end, replacement }) => source.slice(0, start) + replacement + source.slice(end);

if (process.env.UB_MUTANT) {
  const mutant = JSON.parse(process.env.UB_MUTANT);
  const compile = Module.prototype._compile;
  Module.prototype._compile = function (content, filename) {
    return compile.call(this, filename === mutant.file ? apply(content, mutant) : content, filename);
  };
}

module.exports = { apply };
